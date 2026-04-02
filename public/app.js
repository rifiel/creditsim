// Credit Risk Simulator Frontend JavaScript

class CreditSimulator {
    // Gauge geometry (must match SVG r="70" in index.html)
    static GAUGE_RADIUS     = 70;
    static GAUGE_ARC_RATIO  = 0.75; // 270° / 360°

    // FICO score range
    static MIN_SCORE   = 300;
    static SCORE_RANGE = 550; // 850 - 300

    constructor() {
        this.form = document.getElementById('creditForm');
        this.resultCard = document.getElementById('resultCard');
        this.errorCard = document.getElementById('errorCard');
        this.simulationsList = document.getElementById('simulationsList');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.welcomePanel = document.getElementById('welcomePanel');

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

        // Derive min/max from element attributes — single source of truth
        const sliderMin = parseInt(loanSlider.min, 10);
        const sliderMax = parseInt(loanSlider.max, 10);

        // Update display and gradient fill when slider changes
        const updateSlider = (value) => {
            loanDisplay.textContent = `$${value.toLocaleString()}`;
            loanHidden.value = value;
            const pct = ((value - sliderMin) / (sliderMax - sliderMin)) * 100;
            loanSlider.style.background =
                `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
        };

        loanSlider.addEventListener('input', (e) => updateSlider(parseInt(e.target.value, 10)));

        // Set initial gradient
        updateSlider(parseInt(loanSlider.value, 10));
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
        // Update count badge
        const countBadge = document.getElementById('historyCountBadge');
        if (countBadge) countBadge.textContent = simulations.length;

        if (simulations.length === 0) {
            this.simulationsList.innerHTML = `
                <div class="state-box">
                    <i class="bi bi-inbox"></i>
                    <p>No simulations yet. Submit your first application above!</p>
                </div>
            `;
            return;
        }

        const simulationsHtml = simulations.map(sim => {
            const riskClass = this.getRiskClass(sim.riskCategory);
            const interpretation = this.getScoreInterpretation(sim.score);

            return `
                <div class="sim-card simulation-item ${riskClass}">
                    <div class="sim-body">
                        <div class="sim-top">
                            <div>
                                <div class="sim-name">${this.escapeHtml(sim.name)}</div>
                                <div class="sim-date">
                                    <i class="bi bi-calendar3"></i>
                                    ${this.formatDate(sim.createdAt)}
                                </div>
                            </div>
                            <div class="sim-badge ${riskClass}">${sim.riskCategory}</div>
                        </div>
                        <div class="sim-score-row">
                            <div class="sim-score ${riskClass}">${sim.score}</div>
                            <div class="sim-score-meta">
                                <div class="sim-score-lbl">Credit Score</div>
                                <div class="sim-interp">${interpretation}</div>
                            </div>
                        </div>
                    </div>
                    <div class="sim-footer">
                        <div>
                            <span class="sim-detail-lbl">Loan</span>
                            <span class="sim-detail-val">$${sim.loanAmount.toLocaleString()}</span>
                        </div>
                        <div>
                            <span class="sim-detail-lbl">Score Range</span>
                            <span class="sim-detail-val">300–850</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.simulationsList.innerHTML = `<div class="sim-grid">${simulationsHtml}</div>`;
    }

    showResult(result) {
        const { score, riskCategory, customer } = result;

        // Update text values
        document.getElementById('scoreNumber').textContent = score;
        document.getElementById('customerName').textContent = `for ${customer.name}`;
        document.getElementById('resultLoanAmount').textContent = `$${customer.loanAmount.toLocaleString()}`;
        document.getElementById('resultIncome').textContent = `$${customer.annualIncome.toLocaleString()}`;
        document.getElementById('scoreInterpretation').textContent = this.getScoreInterpretation(score);

        // Update risk badge (preserve inner icon)
        const riskBadge = document.getElementById('riskCategory');
        riskBadge.innerHTML = `<i class="bi bi-circle-fill" style="font-size:0.45rem;"></i> ${riskCategory}`;

        // Apply risk class to card and header
        const riskClass = this.getRiskClass(riskCategory);
        this.resultCard.className = `result-card ${riskClass}`;
        document.getElementById('resultHeader').className = `result-header ${riskClass}`;

        // Animate SVG gauge (radius and score range from class constants)
        const gaugeEl       = document.getElementById('scoreGaugeFill');
        const circumference = 2 * Math.PI * CreditSimulator.GAUGE_RADIUS;
        const trackArc      = CreditSimulator.GAUGE_ARC_RATIO * circumference;
        const fillArc       = this.normalizeScore(score) * trackArc;
        gaugeEl.setAttribute('stroke-dasharray', `${fillArc.toFixed(2)} ${circumference.toFixed(2)}`);

        // Hide welcome panel, show result card
        if (this.welcomePanel) this.welcomePanel.classList.add('d-none');
        this.resultCard.classList.remove('d-none');
    }

    showWelcome() {
        this.resultCard.classList.add('d-none');
        this.errorCard.classList.add('d-none');
        if (this.welcomePanel) this.welcomePanel.classList.remove('d-none');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        if (this.welcomePanel) this.welcomePanel.classList.add('d-none');
        this.errorCard.classList.remove('d-none');
    }

    hideCards() {
        this.resultCard.classList.add('d-none');
        this.errorCard.classList.add('d-none');
    }

    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Analyzing…';
        submitBtn.disabled = true;
    }

    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-calculator-fill"></i> Analyze Credit Risk';
        submitBtn.disabled = false;
    }

    normalizeScore(score) {
        return Math.max(0, Math.min((score - CreditSimulator.MIN_SCORE) / CreditSimulator.SCORE_RANGE, 1));
    }

    getRiskClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'low-risk';
            case 'Medium risk': return 'medium-risk';
            case 'High risk':   return 'high-risk';
            default:            return '';
        }
    }

    getRiskBadgeClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk':    return 'sim-badge low-risk';
            case 'Medium risk': return 'sim-badge medium-risk';
            case 'High risk':   return 'sim-badge high-risk';
            default:            return 'sim-badge';
        }
    }

    getScoreInterpretation(score) {
        if (score >= 750) return 'Excellent';
        if (score >= 700) return 'Good';
        if (score >= 650) return 'Fair';
        if (score >= 580) return 'Poor';
        return 'Very Poor';
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
