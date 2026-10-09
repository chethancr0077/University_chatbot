-- Academic MySQL Bank Management Schema & Automation Script
-- Suitable for MySQL / MariaDB databases
CREATE DATABASE IF NOT EXISTS apex_bank_db;
USE apex_bank_db;
-- ==========================================
-- 1. Table Definitions
-- ==========================================
-- Table: branches
CREATE TABLE IF NOT EXISTS branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL
);
-- Table: customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Table: accounts
CREATE TABLE IF NOT EXISTS accounts (
    account_number VARCHAR(20) PRIMARY KEY,
    customer_id INT NOT NULL,
    branch_id INT NOT NULL,
    account_type ENUM('SAVINGS', 'CHECKING', 'LOAN') NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_branch FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE RESTRICT,
    CONSTRAINT chk_positive_balance CHECK (balance >= 0.00)
);
-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    source_account VARCHAR(20) NULL,
    destination_account VARCHAR(20) NULL,
    transaction_type ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_source FOREIGN KEY (source_account) REFERENCES accounts(account_number) ON DELETE RESTRICT,
    CONSTRAINT fk_tx_dest FOREIGN KEY (destination_account) REFERENCES accounts(account_number) ON DELETE RESTRICT,
    CONSTRAINT chk_positive_amount CHECK (amount > 0.00)
);
-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    query_executed TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ==========================================
-- 2. Database Triggers (Automation)
-- ==========================================
DELIMITER $$
-- Trigger 1: Log Customer Creation
CREATE TRIGGER tr_after_customer_insert
AFTER INSERT ON customers
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action_type, details, query_executed)
    VALUES (
        'CUSTOMER_CREATED', 
        CONCAT('New customer registered: ', NEW.first_name, ' ', NEW.last_name, ' (ID: ', NEW.customer_id, ')'),
        'INSERT INTO customers'
    );
END$$
-- Trigger 2: Log Account Creation
CREATE TRIGGER tr_after_account_insert
AFTER INSERT ON accounts
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action_type, details, query_executed)
    VALUES (
        'ACCOUNT_OPENED', 
        CONCAT('Account ', NEW.account_number, ' (', NEW.account_type, ') opened for Customer ID: ', NEW.customer_id, ' with initial balance $', NEW.balance),
        'INSERT INTO accounts'
    );
END$$
-- Trigger 3: Automatically Log New Transactions
CREATE TRIGGER tr_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE log_details TEXT;
    
    IF NEW.transaction_type = 'DEPOSIT' THEN
        SET log_details = CONCAT('Transaction ID ', NEW.transaction_id, ': Deposit of $', NEW.amount, ' to account ', NEW.destination_account);
    ELSEIF NEW.transaction_type = 'WITHDRAWAL' THEN
        SET log_details = CONCAT('Transaction ID ', NEW.transaction_id, ': Withdrawal of $', NEW.amount, ' from account ', NEW.source_account);
    ELSE
        SET log_details = CONCAT('Transaction ID ', NEW.transaction_id, ': Transfer of $', NEW.amount, ' from account ', NEW.source_account, ' to account ', NEW.destination_account);
    END IF;
    INSERT INTO audit_logs (action_type, details, query_executed)
    VALUES ('TRANSACTION_RECORDED', log_details, 'INSERT INTO transactions');
END$$
DELIMITER ;
-- ==========================================
-- 3. Stored Procedures (DBMS Functions)
-- ==========================================
DELIMITER $$
-- Procedure 1: Register Customer & Automatically Open Account
CREATE PROCEDURE register_new_customer(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_address VARCHAR(255),
    IN p_branch_id INT,
    IN p_account_type VARCHAR(20),
    IN p_initial_deposit DECIMAL(15,2),
    IN p_account_number VARCHAR(20)
)
BEGIN
    -- Error Handling: Rollback on SQL Exceptions
    DECLARE exit handler FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration aborted. SQL Exception occurred.';
    END;
    START TRANSACTION;
        -- Insert Customer record
        INSERT INTO customers (first_name, last_name, email, phone, address)
        VALUES (p_first_name, p_last_name, p_email, p_phone, p_address);
        
        -- Get generated Customer ID
        SET @new_cust_id = LAST_INSERT_ID();
        -- Create Account linked to Customer
        INSERT INTO accounts (account_number, customer_id, branch_id, account_type, balance)
        VALUES (p_account_number, @new_cust_id, p_branch_id, p_account_type, p_initial_deposit);
        -- Record Deposit if initial deposit > 0
        IF p_initial_deposit > 0.00 THEN
            INSERT INTO transactions (destination_account, transaction_type, amount)
            VALUES (p_account_number, 'DEPOSIT', p_initial_deposit);
        END IF;
    COMMIT;
END$$
-- Procedure 2: Safe Balance Transfer with Balance Check (Demonstrates ACID Properties)
CREATE PROCEDURE transfer_funds(
    IN p_source_acc VARCHAR(20),
    IN p_dest_acc VARCHAR(20),
    IN p_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_sender_balance DECIMAL(15,2);
    DECLARE v_sender_status VARCHAR(10);
    DECLARE v_receiver_status VARCHAR(10);
    -- Error Handling: Rollback transaction if any SQL Exception is raised
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction failed. Rolled back.';
    END;
    START TRANSACTION;
        -- Lock records for Isolation (Concurrency check)
        SELECT balance, status INTO v_sender_balance, v_sender_status 
        FROM accounts WHERE account_number = p_source_acc FOR UPDATE;
        
        SELECT status INTO v_receiver_status 
        FROM accounts WHERE account_number = p_dest_acc FOR UPDATE;
        -- 1. Validate Source Account exists and is Active
        IF v_sender_status IS NULL OR v_sender_status != 'ACTIVE' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transfer failed. Sender account not found or inactive.';
        END IF;
        -- 2. Validate Destination Account exists and is Active
        IF v_receiver_status IS NULL OR v_receiver_status != 'ACTIVE' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transfer failed. Receiver account not found or inactive.';
        END IF;
        -- 3. Check for sufficient balance
        IF v_sender_balance < p_amount THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transfer failed. Insufficient funds in sender account.';
        END IF;
        -- 4. Deduct balance from sender
        UPDATE accounts SET balance = balance - p_amount WHERE account_number = p_source_acc;
        -- 5. Credit balance to receiver
        UPDATE accounts SET balance = balance + p_amount WHERE account_number = p_dest_acc;
        -- 6. Insert transaction logs (Triggers will auto-update audit logs)
        INSERT INTO transactions (source_account, destination_account, transaction_type, amount)
        VALUES (p_source_acc, p_dest_acc, 'TRANSFER', p_amount);
    COMMIT;
END$$
DELIMITER ;
-- ==========================================
-- 4. Seed Initial Data
-- ==========================================
-- Branches
INSERT INTO branches (branch_name, branch_code, city) VALUES 
('Main Branch', 'MN001', 'New York'),
('West Coast Branch', 'WC002', 'San Francisco'),
('Downtown Branch', 'DT003', 'Chicago');
-- Customers
INSERT INTO customers (first_name, last_name, email, phone, address) VALUES 
('Alice', 'Smith', 'alice.smith@email.com', '123-456-7890', '123 Pine St, New York'),
('Bob', 'Johnson', 'bob.johnson@email.com', '234-567-8901', '456 Oak Ave, San Francisco'),
('Charlie', 'Brown', 'charlie.brown@email.com', '345-678-9012', '789 Maple Rd, Chicago');
-- Accounts
INSERT INTO accounts (account_number, customer_id, branch_id, account_type, balance) VALUES 
('ACC-10001', 1, 1, 'SAVINGS', 5000.00),
('ACC-10002', 1, 1, 'CHECKING', 1200.50),
('ACC-20001', 2, 2, 'SAVINGS', 12500.00),
('ACC-30001', 3, 3, 'SAVINGS', 450.00);
-- Transactions (deposits)
INSERT INTO transactions (destination_account, transaction_type, amount) VALUES 
('ACC-10001', 'DEPOSIT', 5000.00),
('ACC-10002', 'DEPOSIT', 1200.50),
('ACC-20001', 'DEPOSIT', 12500.00),
('ACC-30001', 'DEPOSIT', 450.00);
-- Run a Transfer using the Stored Procedure
CALL transfer_funds('ACC-10001', 'ACC-30001', 300.00);