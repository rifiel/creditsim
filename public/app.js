// Credit Risk Simulator Frontend JavaScript

class CreditSimulator {
    constructor() {
        this.form = document.getElementById('creditForm');
        this.resultCard = document.getElementById('resultCard');
        this.emptyState = document.getElementById('emptyState');
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
                <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:1rem 1.25rem;color:#f59e0b;font-size:0.85rem;">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load previous simulations: ${this.escapeHtml(error.message)}
                </div>
            `;
        }
    }
    
    renderSimulations(simulations) {
        if (simulations.length === 0) {
            this.simulationsList.innerHTML = `
                <div class="empty-history">
                    <i class="bi bi-inbox"></i>
                    <p>No simulations yet. Run your first simulation above!</p>
                </div>
            `;
            return;
        }
        
        const simulationsHtml = simulations.map(sim => {
            const riskClass = this.getRiskClass(sim.riskCategory);
            const scoreClass = riskClass.replace('-risk', '-score');
            const badgeClass = riskClass.replace('-risk', '-badge');
            
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="sim-card ${riskClass}">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="sim-card-name" title="${this.escapeHtml(sim.name)}">${this.escapeHtml(sim.name)}</div>
                            <span class="sim-badge ${badgeClass}">${this.escapeHtml(sim.riskCategory)}</span>
                        </div>
                        <div class="d-flex align-items-end justify-content-between">
                            <div>
                                <div class="sim-score ${scoreClass}">${sim.score}</div>
                                <div class="sim-meta">Credit Score</div>
                            </div>
                            <div class="text-end">
                                <div class="sim-loan">$${sim.loanAmount.toLocaleString()}</div>
                                <div class="sim-meta">Loan Amount</div>
                            </div>
                        </div>
                        <div class="sim-date">
                            <i class="bi bi-clock me-1"></i>${this.formatDate(sim.createdAt)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.simulationsList.innerHTML = `<div class="row">${simulationsHtml}</div>`;
    }
    
    // ── Score Gauge ─────────────────────────────────────────────
    drawScoreGauge(score, riskCategory) {
        const MIN = 300, MAX = 850;
        const cx = 110, cy = 115, r = 90;

        // Compute arc end point for the given score
        const ratio = (score - MIN) / (MAX - MIN);         // 0..1
        const angleDeg = -180 + ratio * 180;               // -180° (left) → 0° (right)
        const angleRad = angleDeg * Math.PI / 180;
        const x = cx + r * Math.cos(angleRad);
        const y = cy + r * Math.sin(angleRad);
        const largeArc = ratio > 0.5 ? 1 : 0;

        const colorMap = {
            'Low risk':    '#10b981',
            'Medium risk': '#f59e0b',
            'High risk':   '#ef4444'
        };
        const color = colorMap[riskCategory] || '#6366f1';

        const arcPath = document.getElementById('gaugeArc');
        const needle   = document.getElementById('gaugeNeedle');

        if (arcPath) {
            arcPath.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`);
            arcPath.setAttribute('stroke', color);
        }
        if (needle) {
            needle.setAttribute('cx', x);
            needle.setAttribute('cy', y);
            needle.setAttribute('fill', color);
        }
    }

    showResult(result) {
        const { score, riskCategory, customer } = result;
        
        // Update score number
        document.getElementById('scoreNumber').textContent = score;
        document.getElementById('customerName').textContent = `for ${customer.name}`;
        document.getElementById('resultLoanAmount').textContent = `$${customer.loanAmount.toLocaleString()}`;
        document.getElementById('resultIncome').textContent = `$${customer.annualIncome.toLocaleString()}`;
        
        // Update risk badge
        const riskBadge = document.getElementById('riskCategory');
        const riskClass = this.getRiskClass(riskCategory);
        const riskMod = riskClass.replace('-risk', '');   // 'low' | 'medium' | 'high'
        riskBadge.className = `risk-badge mx-auto risk-${riskMod}`;
        riskBadge.innerHTML = `<span class="risk-badge-dot dot-${riskMod}"></span><span>${this.escapeHtml(riskCategory)}</span>`;

        // Draw gauge
        this.drawScoreGauge(score, riskCategory);

        // Show result panel, hide empty state
        if (this.emptyState) this.emptyState.classList.add('d-none');
        this.resultCard.classList.remove('d-none');
        this._hasResult = true;
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.errorCard.classList.remove('d-none');
    }
    
    hideCards() {
        this.resultCard.classList.add('d-none');
        this.errorCard.classList.add('d-none');
        // Keep emptyState hidden once a result has been shown; show it if no result yet
        if (this.emptyState && !this._hasResult) {
            this.emptyState.classList.remove('d-none');
        }
    }
    
    showLoading() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Calculating…';
        submitBtn.disabled = true;
    }
    
    hideLoading() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<i class="bi bi-lightning-charge-fill me-2"></i>Run Simulation';
        submitBtn.disabled = false;
    }
    
    getRiskClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'low-risk';
            case 'Medium risk': return 'medium-risk';
            case 'High risk':   return 'high-risk';
            default: return '';
        }
    }
    
    getRiskBadgeClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'bg-success';
            case 'Medium risk': return 'bg-warning text-dark';
            case 'High risk':   return 'bg-danger';
            default: return 'bg-secondary';
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
