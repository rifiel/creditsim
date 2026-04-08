// Credit Risk Simulator Frontend JavaScript

class CreditSimulator {
    constructor() {
        this.form = document.getElementById('creditForm');
        this.resultCard = document.getElementById('resultCard');
        this.errorCard = document.getElementById('errorCard');
        this.simulationsList = document.getElementById('simulationsList');
        this.paginationControls = document.getElementById('paginationControls');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.currentPage = 1;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.refreshBtn.addEventListener('click', () => this.loadSimulations(1));

        // Read initial page from URL
        const params = new URLSearchParams(window.location.search);
        this.currentPage = parseInt(params.get('page')) || 1;

        // Load previous simulations on page load
        this.loadSimulations(this.currentPage, false);

        // Handle browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            const page = (e.state && e.state.page) || 1;
            this.currentPage = page;
            this.loadSimulations(page, false);
        });

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
            this.loadSimulations(1); // Refresh the list from page 1
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
    
    async loadSimulations(page = 1, pushToHistory = true) {
        this.currentPage = page;

        if (pushToHistory) {
            const url = page === 1 ? window.location.pathname : `${window.location.pathname}?page=${page}`;
            history.pushState({ page }, '', url);
        }

        try {
            const response = await fetch(`/api/simulations?page=${page}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load simulations');
            }

            this.renderSimulations(data.simulations);
            this.renderPagination(data.page, data.totalPages);
        } catch (error) {
            this.simulationsList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i>
                    Failed to load previous simulations: ${this.escapeHtml(error.message)}
                </div>
            `;
            this.paginationControls.innerHTML = '';
        }
    }

    renderPagination(page, totalPages) {
        if (totalPages <= 1) {
            this.paginationControls.innerHTML = '';
            return;
        }

        const maxVisible = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        const prevDisabled = page === 1;
        const nextDisabled = page === totalPages;

        let html = '<ul class="pagination mb-0">';

        html += `<li class="page-item${prevDisabled ? ' disabled' : ''}">
            <button class="page-link" data-page="${page - 1}"${prevDisabled ? ' tabindex="-1" aria-disabled="true"' : ''}>
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>`;

        if (startPage > 1) {
            html += `<li class="page-item"><button class="page-link" data-page="1">1</button></li>`;
            if (startPage > 2) {
                html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<li class="page-item${i === page ? ' active' : ''}">
                <button class="page-link" data-page="${i}">${i}</button>
            </li>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
            }
            html += `<li class="page-item"><button class="page-link" data-page="${totalPages}">${totalPages}</button></li>`;
        }

        html += `<li class="page-item${nextDisabled ? ' disabled' : ''}">
            <button class="page-link" data-page="${page + 1}"${nextDisabled ? ' tabindex="-1" aria-disabled="true"' : ''}>
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>`;

        html += '</ul>';

        this.paginationControls.innerHTML = html;

        this.paginationControls.querySelectorAll('button.page-link:not([aria-disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetPage = parseInt(btn.dataset.page);
                this.loadSimulations(targetPage);
            });
        });
    }
    
    renderSimulations(simulations) {
        if (simulations.length === 0) {
            this.simulationsList.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-inbox"></i><br>
                    No simulations yet. Submit your first calculation above!
                </div>
            `;
            return;
        }
        
        const simulationsHtml = simulations.map(sim => {
            const riskClass = this.getRiskClass(sim.riskCategory);
            const riskBadgeClass = this.getRiskBadgeClass(sim.riskCategory);
            
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card simulation-item h-100 ${riskClass}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">${this.escapeHtml(sim.name)}</h6>
                                <span class="badge ${riskBadgeClass}">${sim.riskCategory}</span>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <div class="h4 mb-0">${sim.score}</div>
                                    <small class="text-muted">Credit Score</small>
                                </div>
                                <div class="col-6 text-end">
                                    <div class="fw-bold">$${sim.loanAmount.toLocaleString()}</div>
                                    <small class="text-muted">Loan Amount</small>
                                </div>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="bi bi-calendar"></i> 
                                    ${this.formatDate(sim.createdAt)}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.simulationsList.innerHTML = `
            <div class="row">
                ${simulationsHtml}
            </div>
        `;
    }
    
    showResult(result) {
        const { score, riskCategory, customer } = result;
        
        // Update result card
        document.getElementById('scoreNumber').textContent = score;
        document.getElementById('customerName').textContent = `for ${customer.name}`;
        document.getElementById('resultLoanAmount').textContent = `$${customer.loanAmount.toLocaleString()}`;
        document.getElementById('resultIncome').textContent = `$${customer.annualIncome.toLocaleString()}`;
        
        // Update risk category badge
        const riskBadge = document.getElementById('riskCategory');
        riskBadge.textContent = riskCategory;
        riskBadge.className = `badge fs-6 mb-3 ${this.getRiskBadgeClass(riskCategory)}`;
        
        // Update card styling
        this.resultCard.className = `card score-card ${this.getRiskClass(riskCategory)}`;
        
        this.resultCard.classList.remove('d-none');
    }
    
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.errorCard.classList.remove('d-none');
    }
    
    hideCards() {
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
    
    getRiskBadgeClass(riskCategory) {
        switch (riskCategory) {
            case 'Low risk': return 'bg-success';
            case 'Medium risk': return 'bg-warning text-dark';
            case 'High risk': return 'bg-danger';
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
