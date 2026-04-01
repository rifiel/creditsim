const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { seedIfNeeded } = require('./seed');

const DB_PATH = path.join(__dirname, '../../data/creditsim.db');

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          // Enable foreign keys
          this.db.run('PRAGMA foreign_keys = ON');
          resolve();
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createCustomersTable = `
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          age INTEGER NOT NULL,
          annualIncome REAL NOT NULL,
          debtToIncomeRatio REAL NOT NULL,
          loanAmount REAL NOT NULL,
          creditHistory TEXT NOT NULL CHECK (creditHistory IN ('good', 'bad')),
          score INTEGER NOT NULL,
          riskCategory TEXT NOT NULL CHECK (riskCategory IN ('Low risk', 'Medium risk', 'High risk')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createCustomersTable, (err) => {
        if (err) {
          console.error('Error creating customers table:', err.message);
          reject(err);
        } else {
          console.log('Customers table created or already exists');
          resolve();
        }
      });
    });
  }

  async insertCustomer(customerData) {
    return new Promise((resolve, reject) => {
      const { name, age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory, score, riskCategory } = customerData;
      
      const insertSQL = `
        INSERT INTO customers (name, age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory, score, riskCategory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(insertSQL, [name, age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory, score, riskCategory], function(err) {
        if (err) {
          console.error('Error inserting customer:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, ...customerData });
        }
      });
    });
  }

  async getAllCustomers() {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM customers ORDER BY createdAt DESC';
      
      this.db.all(selectSQL, [], (err, rows) => {
        if (err) {
          console.error('Error fetching customers:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getCustomersPaginated(page = 1, limit = 3) {
    return new Promise((resolve, reject) => {
      // Validate and sanitize inputs
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 3)); // Max 100 items per page
      const offset = (pageNum - 1) * limitNum;
      
      const selectSQL = 'SELECT * FROM customers ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      
      this.db.all(selectSQL, [limitNum, offset], (err, rows) => {
        if (err) {
          console.error('Error fetching paginated customers:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getCustomerById(id) {
    return new Promise((resolve, reject) => {
      const selectSQL = 'SELECT * FROM customers WHERE id = ?';
      
      this.db.get(selectSQL, [id], (err, row) => {
        if (err) {
          console.error('Error fetching customer:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async countCustomers() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) AS count FROM customers', [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton instance
const database = new Database();

async function initializeDatabase() {
  try {
    await database.connect();
    await database.createTables();
    await seedIfNeeded(database);
    return database;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  database,
  initializeDatabase
};
