# Credit Risk Simulator

A lightweight Node.js web application that calculates simulated credit risk scores for demonstration purposes.

> ⚠️ **Disclaimer**: This is a demonstration application only. Do not use for actual credit decisions or in production environments.

## Features

- **Simple Credit Scoring**: Rule-based scoring algorithm based on customer demographics and financial data
- **REST API**: Clean endpoints for simulation and data retrieval
- **Web Interface**: Bootstrap-powered frontend for easy interaction
- **SQLite Database**: Lightweight persistence for simulation history
- **Comprehensive Testing**: Unit and integration tests with Jest
- **Responsive Design**: Mobile-friendly interface
- **Terms & Conditions**: Public Terms & Conditions page with structured sections and configurable effective date

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:setup
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser to `http://localhost:3000`

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### POST /api/simulate
Calculate credit score for a customer.

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 35,
  "annualIncome": 60000,
  "debtToIncomeRatio": 0.3,
  "loanAmount": 25000,
  "creditHistory": "good"
}
```

**Field Validation:**
- `name`: String, 1-100 characters
- `age`: Integer, 18-120
- `annualIncome`: Number, >= 0
- `debtToIncomeRatio`: Number, 0-1 (e.g., 0.3 = 30%)
- `loanAmount`: Number, > 0
- `creditHistory`: String, "good" or "bad"

**Response (201):**
```json
{
  "id": 1,
  "score": 640,
  "riskCategory": "Medium risk",
  "message": "Credit score calculated successfully",
  "customer": {
    "name": "John Doe",
    "age": 35,
    "annualIncome": 60000,
    "debtToIncomeRatio": 0.3,
    "loanAmount": 25000,
    "creditHistory": "good"
  }
}
```

#### GET /api/simulations
Retrieve all previous simulations.

**Response (200):**
```json
{
  "count": 2,
  "simulations": [
    {
      "id": 1,
      "name": "John Doe",
      "score": 640,
      "riskCategory": "Medium risk",
      "loanAmount": 25000,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/simulation/:id
Retrieve a specific simulation by ID.

**Response (200):**
```json
{
  "simulation": {
    "id": 1,
    "name": "John Doe",
    "age": 35,
    "annualIncome": 60000,
    "debtToIncomeRatio": 0.3,
    "loanAmount": 25000,
    "creditHistory": "good",
    "score": 640,
    "riskCategory": "Medium risk",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET /api/scoring-criteria
Get explanation of scoring criteria.

**Response (200):**
```json
{
  "criteria": {
    "baseScore": 600,
    "adjustments": {
      "age": {
        "under25": -50,
        "over60": -30
      },
      "income": {
        "over50k": 40
      },
      "debtToIncomeRatio": {
        "over40percent": -80
      },
      "creditHistory": {
        "bad": -150
      },
      "loanToIncomeRatio": {
        "over50percent": -50
      }
    },
    "riskCategories": {
      "lowRisk": "750+",
      "mediumRisk": "650-749",
      "highRisk": "Below 650"
    }
  },
  "disclaimer": "This is a demonstration scoring model and should not be used for actual credit decisions."
}
```

#### GET /api/health
Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

## Credit Scoring Logic

The scoring algorithm starts with a **base score of 600** and applies the following adjustments:

### Age Adjustments
- **Under 25**: -50 points (limited credit history)
- **Over 60**: -30 points (approaching retirement)

### Income Adjustments
- **Over $50,000**: +40 points (stable income)

### Debt-to-Income Ratio
- **Over 40%**: -80 points (high debt burden)

### Credit History
- **Bad credit**: -150 points (payment history concerns)

### Loan-to-Income Ratio
- **Over 50% of income**: -50 points (high loan burden)

### Risk Categories
- **750+**: Low risk
- **650-749**: Medium risk
- **Below 650**: High risk

### Score Range
Final scores are constrained between 300 and 850 (standard FICO range).

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage

The application includes comprehensive tests for:
- Credit scoring logic (unit tests)
- API endpoints (integration tests)
- Input validation
- Error handling
- Database operations

## Project Structure

```
credit-risk-simulator/
├── src/
│   ├── app.js                 # Main Express application
│   ├── database/
│   │   ├── database.js        # Database models and operations
│   │   └── setup.js           # Database initialization script
│   ├── routes/
│   │   └── simulation.js      # API route handlers
│   └── services/
│       └── creditScoring.js   # Credit scoring business logic
├── public/
│   ├── index.html            # Main HTML interface
│   └── app.js                # Frontend JavaScript
├── tests/
│   ├── creditScoring.test.js # Unit tests for scoring logic
│   └── api.test.js           # Integration tests for API
├── data/
│   └── creditsim.db          # SQLite database (created automatically)
├── package.json
└── README.md
```

## Database Schema

### customers table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| name | TEXT | Customer name |
| age | INTEGER | Customer age |
| annualIncome | REAL | Annual income in dollars |
| debtToIncomeRatio | REAL | Debt-to-income ratio (0-1) |
| loanAmount | REAL | Requested loan amount |
| creditHistory | TEXT | Credit history ("good" or "bad") |
| score | INTEGER | Calculated credit score |
| riskCategory | TEXT | Risk category ("Low risk", "Medium risk", "High risk") |
| createdAt | DATETIME | Timestamp of simulation |

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **Testing**: Jest, Supertest
- **Security**: Helmet.js, CORS
- **Validation**: express-validator

## Environment Variables

The application uses the following optional environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `TERMS_EFFECTIVE_DATE`: Effective date for Terms & Conditions (default: 2025-12-01)
- `TERMS_UPDATE_NOTICE`: Optional update notice for Terms & Conditions (default: empty)

## Security Considerations

- Input validation on all endpoints
- SQL injection protection through parameterized queries
- XSS protection via Content Security Policy
- CORS configuration for cross-origin requests
- Helmet.js for additional security headers

## Known Limitations

1. **Simplified Scoring Model**: This is a basic rule-based system, not a sophisticated ML model
2. **No Authentication**: No user authentication or authorization
3. **Single Database**: Uses SQLite which is not suitable for high-concurrency production use
4. **No Rate Limiting**: No protection against API abuse
5. **Limited Validation**: Basic input validation only

## Future Enhancements

- User authentication and sessions
- More sophisticated scoring algorithms
- Data visualization and analytics
- Export functionality for simulation results
- Rate limiting and API security
- Integration with external credit bureaus (for real applications)

## Contributing

This is a demonstration project. If you'd like to extend it:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - feel free to use this code for learning and demonstration purposes.

## Support

This is a demonstration project and is not actively maintained. Use at your own risk and do not deploy to production environments.
