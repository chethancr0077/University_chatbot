const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'bank.db');
const schemaPath = path.join(dbDir, 'schema.sql');
console.log('Initializing database at:', dbPath);
// Delete existing database file if it exists to start fresh
if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log('Deleted existing database file to start fresh.');
    } catch (err) {
        console.error('Error deleting database file:', err.message);
    }
}
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});
// Enable foreign key support
db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
        console.error('Error enabling foreign keys:', err.message);
    } else {
        console.log('Foreign key support enabled.');
    }
});
// Read and execute schema.sql
try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // db.exec runs multiple statements
    db.exec(schemaSql, (err) => {
        if (err) {
            console.error('Error executing schema SQL:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('Database tables and triggers created successfully.');
        seedData();
    });
} catch (err) {
    console.error('Failed to read schema.sql:', err.message);
    db.close();
    process.exit(1);
}
function seedData() {
    console.log('Seeding initial data...');
    
    // We run in a transaction for seeding
    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        // 1. Seed Branches
        const insertBranch = db.prepare('INSERT INTO branches (branch_name, branch_code, city) VALUES (?, ?, ?)');
        insertBranch.run('Main Branch', 'MN001', 'New York');
        insertBranch.run('West Coast Branch', 'WC002', 'San Francisco');
        insertBranch.run('Downtown Branch', 'DT003', 'Chicago');
        insertBranch.finalize();
        console.log('Branches seeded.');
        // 2. Seed Customers
        const insertCustomer = db.prepare('INSERT INTO customers (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)');
        insertCustomer.run('Alice', 'Smith', 'alice.smith@email.com', '123-456-7890', '123 Pine St, New York');
        insertCustomer.run('Bob', 'Johnson', 'bob.johnson@email.com', '234-567-8901', '456 Oak Ave, San Francisco');
        insertCustomer.run('Charlie', 'Brown', 'charlie.brown@email.com', '345-678-9012', '789 Maple Rd, Chicago');
        insertCustomer.run('David', 'Miller', 'david.miller@email.com', '456-789-0123', '321 Elm St, New York');
        insertCustomer.finalize();
        console.log('Customers seeded.');
        // 3. Seed Accounts
        const insertAccount = db.prepare('INSERT INTO accounts (account_number, customer_id, branch_id, account_type, balance) VALUES (?, ?, ?, ?, ?)');
        // Let's open accounts for seeded customers
        // Alice Smith (customer_id 1)
        insertAccount.run('ACC-10001', 1, 1, 'SAVINGS', 5000.00);
        insertAccount.run('ACC-10002', 1, 1, 'CHECKING', 1200.50);
        
        // Bob Johnson (customer_id 2)
        insertAccount.run('ACC-20001', 2, 2, 'SAVINGS', 12500.00);
        
        // Charlie Brown (customer_id 3)
        insertAccount.run('ACC-30001', 3, 3, 'SAVINGS', 450.00);
        insertAccount.run('ACC-30002', 3, 3, 'CHECKING', 15.00);
        
        // David Miller (customer_id 4)
        insertAccount.run('ACC-40001', 4, 1, 'LOAN', 25000.00);
        insertAccount.finalize();
        console.log('Accounts seeded.');
        // 4. Seed Transactions
        const insertTransaction = db.prepare('INSERT INTO transactions (source_account, destination_account, transaction_type, amount) VALUES (?, ?, ?, ?)');
        
        // Deposits
        insertTransaction.run(null, 'ACC-10001', 'DEPOSIT', 5000.00);
        insertTransaction.run(null, 'ACC-10002', 'DEPOSIT', 1200.50);
        insertTransaction.run(null, 'ACC-20001', 'DEPOSIT', 12500.00);
        insertTransaction.run(null, 'ACC-30001', 'DEPOSIT', 450.00);
        insertTransaction.run(null, 'ACC-30002', 'DEPOSIT', 15.00);
        
        // Transfer from Alice to Charlie
        // Note: In real system, balances are adjusted when transfer occurs.
        // We simulate the transaction record.
        insertTransaction.run('ACC-10001', 'ACC-30002', 'TRANSFER', 200.00);
        
        insertTransaction.finalize();
        
        // Run update query to simulate the balance transfer (deduct from Alice, add to Charlie)
        db.run("UPDATE accounts SET balance = balance - 200.00 WHERE account_number = 'ACC-10001'");
        db.run("UPDATE accounts SET balance = balance + 200.00 WHERE account_number = 'ACC-30002'");
        
        console.log('Transactions seeded.');
        db.run('COMMIT;', (err) => {
            if (err) {
                console.error('Error committing seed transaction:', err.message);
                db.run('ROLLBACK;');
            } else {
                console.log('Database initialization and seeding completed successfully!');
            }
            db.close();
        });
    });
}
