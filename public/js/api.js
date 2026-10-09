// API client wrapper for Apex Bank DBMS Portal
const API_BASE = '/api';
const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = { error: await response.text() };
    }
    if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
    }
    return data;
};
const API = {
    // Get summary statistics for dashboard
    async getDashboardStats() {
        const response = await fetch(`${API_BASE}/dashboard-stats`);
        return handleResponse(response);
    },
    // Fetch all customers list
    async getCustomers() {
        const response = await fetch(`${API_BASE}/customers`);
        return handleResponse(response);
    },
    // Register a new customer
    async createCustomer(customerData) {
        const response = await fetch(`${API_BASE}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        return handleResponse(response);
    },
    // Fetch all bank accounts
    async getAccounts() {
        const response = await fetch(`${API_BASE}/accounts`);
        return handleResponse(response);
    },
    // Open a new account for existing customer
    async createAccount(accountData) {
        const response = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accountData)
        });
        return handleResponse(response);
    },
    // Execute a transaction (Deposit, Withdrawal, Transfer)
    async createTransaction(txData) {
        const response = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(txData)
        });
        return handleResponse(response);
    },
    // Fetch transactions list
    async getTransactions() {
        const response = await fetch(`${API_BASE}/transactions`);
        return handleResponse(response);
    },
    // Fetch all bank branches
    async getBranches() {
        const response = await fetch(`${API_BASE}/branches`);
        return handleResponse(response);
    },
    // Fetch database triggers audit logs table
    async getAuditLogs() {
        const response = await fetch(`${API_BASE}/audit-logs`);
        return handleResponse(response);
    },
    // Fetch live backend intercept SQL query logs
    async getSqlLogs() {
        const response = await fetch(`${API_BASE}/sql-console`);
        return handleResponse(response);
    },
    // Execute arbitrary raw SQL statement
    async runSql(queryText) {
        const response = await fetch(`${API_BASE}/sql-run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: queryText })
        });
        return handleResponse(response);
    }
};
