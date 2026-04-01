const { calculateCreditScore } = require('../services/creditScoring');

const SEED_SIMULATIONS = [
  { name: 'Alice Johnson',    age: 34, annualIncome: 85000,  debtToIncomeRatio: 0.15, loanAmount: 12000,  creditHistory: 'good' },
  { name: 'Bob Martinez',     age: 22, annualIncome: 32000,  debtToIncomeRatio: 0.45, loanAmount: 18000,  creditHistory: 'bad'  },
  { name: 'Carol Williams',   age: 45, annualIncome: 120000, debtToIncomeRatio: 0.10, loanAmount: 20000,  creditHistory: 'good' },
  { name: 'David Brown',      age: 58, annualIncome: 65000,  debtToIncomeRatio: 0.35, loanAmount: 30000,  creditHistory: 'good' },
  { name: 'Eva Davis',        age: 29, annualIncome: 48000,  debtToIncomeRatio: 0.50, loanAmount: 25000,  creditHistory: 'bad'  },
  { name: 'Frank Wilson',     age: 41, annualIncome: 95000,  debtToIncomeRatio: 0.20, loanAmount: 15000,  creditHistory: 'good' },
  { name: 'Grace Moore',      age: 63, annualIncome: 55000,  debtToIncomeRatio: 0.30, loanAmount: 10000,  creditHistory: 'bad'  },
  { name: 'Henry Taylor',     age: 37, annualIncome: 150000, debtToIncomeRatio: 0.08, loanAmount: 8000,   creditHistory: 'good' },
  { name: 'Isabella Anderson',age: 25, annualIncome: 40000,  debtToIncomeRatio: 0.42, loanAmount: 22000,  creditHistory: 'good' },
  { name: 'James Thomas',     age: 52, annualIncome: 72000,  debtToIncomeRatio: 0.25, loanAmount: 18000,  creditHistory: 'good' },
  { name: 'Karen Jackson',    age: 31, annualIncome: 38000,  debtToIncomeRatio: 0.55, loanAmount: 28000,  creditHistory: 'bad'  },
  { name: 'Liam White',       age: 44, annualIncome: 210000, debtToIncomeRatio: 0.05, loanAmount: 5000,   creditHistory: 'good' },
  { name: 'Mia Harris',       age: 27, annualIncome: 58000,  debtToIncomeRatio: 0.18, loanAmount: 12000,  creditHistory: 'good' },
  { name: 'Noah Martin',      age: 60, annualIncome: 44000,  debtToIncomeRatio: 0.48, loanAmount: 35000,  creditHistory: 'bad'  },
  { name: 'Olivia Garcia',    age: 36, annualIncome: 105000, debtToIncomeRatio: 0.12, loanAmount: 9000,   creditHistory: 'good' },
  { name: 'Peter Martinez',   age: 23, annualIncome: 29000,  debtToIncomeRatio: 0.60, loanAmount: 20000,  creditHistory: 'bad'  },
  { name: 'Quinn Robinson',   age: 48, annualIncome: 88000,  debtToIncomeRatio: 0.22, loanAmount: 14000,  creditHistory: 'good' },
  { name: 'Rachel Clark',     age: 33, annualIncome: 62000,  debtToIncomeRatio: 0.38, loanAmount: 19000,  creditHistory: 'good' },
  { name: 'Samuel Lewis',     age: 56, annualIncome: 130000, debtToIncomeRatio: 0.09, loanAmount: 7500,   creditHistory: 'good' },
  { name: 'Tina Lee',         age: 26, annualIncome: 36000,  debtToIncomeRatio: 0.52, loanAmount: 24000,  creditHistory: 'bad'  },
  { name: 'Ulysses Walker',   age: 40, annualIncome: 77000,  debtToIncomeRatio: 0.28, loanAmount: 16000,  creditHistory: 'good' },
  { name: 'Victoria Hall',    age: 65, annualIncome: 49000,  debtToIncomeRatio: 0.33, loanAmount: 11000,  creditHistory: 'bad'  },
  { name: 'William Allen',    age: 39, annualIncome: 175000, debtToIncomeRatio: 0.07, loanAmount: 6000,   creditHistory: 'good' },
  { name: 'Xena Young',       age: 28, annualIncome: 53000,  debtToIncomeRatio: 0.40, loanAmount: 21000,  creditHistory: 'good' },
  { name: 'Yusuf Hernandez',  age: 50, annualIncome: 92000,  debtToIncomeRatio: 0.17, loanAmount: 13000,  creditHistory: 'good' },
  { name: 'Zoe King',         age: 21, annualIncome: 25000,  debtToIncomeRatio: 0.58, loanAmount: 30000,  creditHistory: 'bad'  },
  { name: 'Aaron Wright',     age: 43, annualIncome: 68000,  debtToIncomeRatio: 0.31, loanAmount: 17000,  creditHistory: 'good' },
  { name: 'Bella Scott',      age: 35, annualIncome: 115000, debtToIncomeRatio: 0.11, loanAmount: 10500,  creditHistory: 'good' },
  { name: 'Carlos Green',     age: 55, annualIncome: 41000,  debtToIncomeRatio: 0.46, loanAmount: 26000,  creditHistory: 'bad'  },
  { name: 'Diana Adams',      age: 30, annualIncome: 79000,  debtToIncomeRatio: 0.23, loanAmount: 15500,  creditHistory: 'good' },
];

async function seedIfNeeded(db) {
  const count = await db.countCustomers();
  if (count >= 30) {
    console.log(`Database already has ${count} simulations, skipping seed`);
    return;
  }

  console.log(`Database has ${count} simulations, seeding ${SEED_SIMULATIONS.length} records...`);

  for (const sim of SEED_SIMULATIONS) {
    const { score, riskCategory } = calculateCreditScore(sim);
    await db.insertCustomer({ ...sim, score, riskCategory });
  }

  console.log(`Seeded ${SEED_SIMULATIONS.length} simulations successfully`);
}

module.exports = { seedIfNeeded };
