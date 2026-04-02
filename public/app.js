// Credit Risk Simulator Frontend JavaScript

class CreditSimulator {
    constructor() {
        this.form = document.getElementById('creditForm');
        this.resultPlaceholder = document.getElementById('resultPlaceholder');
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
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>No simulations yet. Submit your first calculation above.</p>
                </div>
            `;
            return;
        }
        
        const rows = simulations.map(sim => {
            const riskClass = this.getRiskClass(sim.riskCategory);
            return `
                <tr>
                    <td class="fw-medium">${this.escapeHtml(sim.name)}</td>
                    <td><span class="sim-score ${riskClass}">${sim.score}</span></td>
                    <td><span class="risk-pill ${riskClass}">${sim.riskCategory}</span></td>
                    <td>$${sim.loanAmount.toLocaleString()}</td>
                    <td class="text-muted">${this.formatDate(sim.createdAt)}</td>
                </tr>
            `;
        }).join('');
        
        this.simulationsList.innerHTML = `
            <div class="table-responsive">
                <table class="sim-table table table-borderless mb-0">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Score</th>
                            <th>Risk</th>
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
        const riskClass = this.getRiskClass(riskCategory);
        
        // Update score ring
        const scoreRing = document.getElementById('scoreRing');
        scoreRing.className = `score-ring ${riskClass}`;
        document.getElementById('scoreNumber').textContent = score;

        // Update risk badge
        const riskBadge = document.getElementById('riskCategory');
        riskBadge.textContent = riskCategory;
        riskBadge.className = `risk-badge ${riskClass}`;

        document.getElementById('customerName').textContent = `for ${customer.name}`;
        document.getElementById('resultLoanAmount').textContent = `$${customer.loanAmount.toLocaleString()}`;
        document.getElementById('resultIncome').textContent = `$${customer.annualIncome.toLocaleString()}`;
        
        this.resultPlaceholder.classList.add('d-none');
        this.resultCard.classList.remove('d-none');
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.resultPlaceholder.classList.add('d-none');
        this.errorCard.classList.remove('d-none');
    }
    
    hideCards() {
        this.resultPlaceholder.classList.remove('d-none');
        this.resultCard.classList.add('d-none');
        this.errorCard.classList.add('d-none');
    }
    
    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Calculating...';
        submitBtn.disabled = true;
    }
    
    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-calculator"></i> Calculate Credit Score';
        submitBtn.disabled = false;
    }
    
    getRiskClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk': return 'low-risk';
            case 'Medium risk': return 'medium-risk';
            case 'High risk': return 'high-risk';
            default: return '';
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
