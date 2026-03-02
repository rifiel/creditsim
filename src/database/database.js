const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

  async deleteCustomersByIds(ids) {
    const maxIds = 1000;

    if (!Array.isArray(ids)) {
      throw new Error('Customer IDs must be an array');
    }

    if (!ids.length) {
      return Promise.resolve();
    }

    if (ids.length > maxIds) {
      throw new Error('Too many customer IDs');
    }

    if (!ids.every((id) => Number.isInteger(id))) {
      throw new Error('Customer IDs must be integers');
    }

    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(', ');
      const deleteSQL = `DELETE FROM customers WHERE id IN (${placeholders})`;

      this.db.run(deleteSQL, ids, (err) => {
        if (err) {
          console.error('Error deleting customers:', err.message);
          reject(err);
        } else {
          resolve();
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
    return database;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  database,
  initializeDatabase,
  Database
};
