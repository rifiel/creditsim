// Credit Risk Simulator Frontend JavaScript

class CreditSimulator {
    // Button label constants
    static BTN_DEFAULT = '<i class="bi bi-calculator me-1"></i>Run Credit Assessment';
    static BTN_LOADING = '<i class="bi bi-hourglass-split me-1"></i>Calculating…';

    constructor() {
        this.form = document.getElementById('creditForm');
        this.resultCard = document.getElementById('resultCard');
        this.errorCard = document.getElementById('errorCard');
        this.simulationsList = document.getElementById('simulationsList');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.refreshBtn.addEventListener('click', this.loadSimulations.bind(this));
        
        // Load previous simulations on page load
        this.loadSimulations();
        
        // Add slider handler only (removed income formatting)
        this.setupLoanSlider();
    }
    
    setupLoanSlider() {
        const loanSlider = document.getElementById('loanAmount');
        const loanDisplay = document.getElementById('loanAmountDisplay');
        const loanHidden = document.getElementById('loanAmountValue');
        
        // Update display when slider changes
        loanSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            loanDisplay.textContent = `$${value.toLocaleString()}`;
            loanHidden.value = value;
        });
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        this.hideCards();
        this.showLoading();
        
        try {
            const formData = this.getFormData();
            const response = await this.submitSimulation(formData);
            this.showResult(response);
            this.loadSimulations(); // Refresh the list
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key === 'name') {
                data[key] = value.trim();
            } else if (key === 'age') {
                data[key] = parseInt(value);
            } else if (key === 'annualIncome') {
                // Parse annual income directly (no comma removal needed)
                data[key] = parseFloat(value);
            } else if (key === 'loanAmount') {
                // Get loan amount from slider value
                data[key] = parseInt(value);
            } else if (key === 'debtToIncomeRatio') {
                data[key] = parseFloat(value);
            } else if (key === 'loanAmountValue') {
                // Skip the hidden field, we use loanAmount
                continue;
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    async submitSimulation(data) {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to calculate credit score');
        }
        
        return result;
    }
    
    async loadSimulations() {
        try {
            const response = await fetch('/api/simulations');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load simulations');
            }
            
            this.renderSimulations(data.simulations);
        } catch (error) {
            this.simulationsList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> 
                    Failed to load previous simulations: ${error.message}
                </div>
            `;
        }
    }
    
    renderSimulations(simulations) {
        if (simulations.length === 0) {
            this.simulationsList.innerHTML = `
                <div class="state-empty">
                    <i class="bi bi-inbox d-block mb-2" style="font-size:1.5rem;"></i>
                    No simulations yet. Submit your first assessment above.
                </div>
            `;
            return;
        }

        const rows = simulations.map(sim => {
            const badgeClass = this.getRiskBadgeClass(sim.riskCategory);
            return `
                <tr>
                    <td class="fw-medium">${this.escapeHtml(sim.name)}</td>
                    <td><span class="score-pill">${sim.score}</span></td>
                    <td><span class="risk-badge ${badgeClass}">${sim.riskCategory}</span></td>
                    <td>$${sim.loanAmount.toLocaleString()}</td>
                    <td class="text-muted">${this.formatDate(sim.createdAt)}</td>
                </tr>
            `;
        }).join('');

        this.simulationsList.innerHTML = `
            <div class="table-responsive">
                <table class="table sim-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Score</th>
                            <th>Risk Level</th>
                            <th>Loan Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }
    
    showResult(result) {
        const { score, riskCategory, customer } = result;

        // Score and customer details
        document.getElementById('scoreNumber').textContent = score;
        document.getElementById('customerName').textContent = customer.name;
        document.getElementById('resultLoanAmount').textContent = `$${customer.loanAmount.toLocaleString()}`;
        document.getElementById('resultIncome').textContent = `$${customer.annualIncome.toLocaleString()}`;

        // Risk category indicator
        const riskEl = document.getElementById('riskCategory');
        const riskIcon = riskCategory === 'Low risk'    ? 'bi-check-circle' :
                         riskCategory === 'Medium risk' ? 'bi-dash-circle'  : 'bi-x-circle';
        riskEl.className = `risk-indicator ${this.getRiskIndicatorClass(riskCategory)}`;
        riskEl.innerHTML = `<i class="bi ${riskIcon}"></i>${riskCategory}`;

        // Score bar: FICO range is 300–850 (span of 550 points)
        const scoreBar = document.getElementById('scoreBar');
        const pct = Math.max(0, Math.min(100, ((score - 300) / 550) * 100));
        scoreBar.style.width = pct + '%';
        scoreBar.className = `score-bar score-bar-${this.getRiskBarClass(riskCategory)}`;

        // Panel left-border accent
        this.resultCard.className = `panel ${this.getRiskClass(riskCategory)} mb-4`;
        this.resultCard.style.display = '';
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.errorCard.style.display = '';
    }
    
    hideCards() {
        this.resultCard.style.display = 'none';
        this.errorCard.style.display = 'none';
    }
    
    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = CreditSimulator.BTN_LOADING;
        submitBtn.disabled = true;
    }
    
    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = CreditSimulator.BTN_DEFAULT;
        submitBtn.disabled = false;
    }
    
    getRiskClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'result-low';
            case 'Medium risk': return 'result-medium';
            case 'High risk':   return 'result-high';
            default:            return '';
        }
    }
    
    getRiskBadgeClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'risk-badge-low';
            case 'Medium risk': return 'risk-badge-medium';
            case 'High risk':   return 'risk-badge-high';
            default:            return 'risk-badge-default';
        }
    }

    getRiskIndicatorClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'risk-low';
            case 'Medium risk': return 'risk-medium';
            case 'High risk':   return 'risk-high';
            default:            return '';
        }
    }

    getRiskBarClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'low';
            case 'Medium risk': return 'medium';
            case 'High risk':   return 'high';
            default:            return 'low';
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CreditSimulator();
});
