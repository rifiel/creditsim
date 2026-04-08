// Credit Risk Simulator Frontend JavaScript

class CreditSimulator {
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
        this.refreshBtn.addEventListener('click', () => this.loadSimulations());
        
        // Restore page from URL on browser back/forward
        window.addEventListener('popstate', () => this.loadSimulations(null, { pushState: false }));
        
        // Load previous simulations on page load (replace state so initial load sets ?page=1)
        this.loadSimulations(null, { replaceState: true });
        
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
            this.loadSimulations(1, { pushState: true }); // Go to page 1 so new entry is visible
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
    
    async loadSimulations(page = null, { pushState = false, replaceState = false } = {}) {
        // Resolve page: explicit argument > URL query string > 1
        if (page === null) {
            const params = new URLSearchParams(window.location.search);
            page = parseInt(params.get('page')) || 1;
        }

        // Sync URL
        const newUrl = `${window.location.pathname}?page=${page}`;
        if (pushState) {
            history.pushState({ page }, '', newUrl);
        } else if (replaceState) {
            history.replaceState({ page }, '', newUrl);
        }

        try {
            const response = await fetch(`/api/simulations?page=${page}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load simulations');
            }
            
            this.renderSimulations(data.data);
            this.renderPagination(data.currentPage, data.totalPages);
        } catch (error) {
            this.simulationsList.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> 
                    Failed to load previous simulations: ${error.message}
                </div>
            `;
            document.getElementById('simulationsPagination').innerHTML = '';
        }
    }

    renderPagination(currentPage, totalPages) {
        const nav = document.getElementById('simulationsPagination');

        if (totalPages <= 1) {
            nav.innerHTML = '';
            return;
        }

        const pageNumbers = this.buildPageNumbers(currentPage, totalPages);

        const items = pageNumbers.map(p => {
            if (p === '...') {
                return `<li class="page-item disabled" aria-hidden="true">
                    <span class="page-link">&hellip;</span>
                </li>`;
            }
            const isActive = p === currentPage;
            return `<li class="page-item${isActive ? ' active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
                <button class="page-link" data-page="${p}">${p}</button>
            </li>`;
        }).join('');

        nav.innerHTML = `
            <ul class="pagination justify-content-center mb-0">
                <li class="page-item${currentPage === 1 ? ' disabled' : ''}">
                    <button class="page-link" data-page="${currentPage - 1}" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </button>
                </li>
                ${items}
                <li class="page-item${currentPage === totalPages ? ' disabled' : ''}">
                    <button class="page-link" data-page="${currentPage + 1}" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </button>
                </li>
            </ul>
        `;

        nav.querySelectorAll('button[data-page]').forEach(btn => {
            const targetPage = parseInt(btn.dataset.page);
            if (targetPage >= 1 && targetPage <= totalPages) {
                btn.addEventListener('click', () => this.loadSimulations(targetPage, { pushState: true }));
            }
        });
    }

    buildPageNumbers(currentPage, totalPages) {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        // Ellipsis trimming for larger page counts
        const pages = [];
        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        }
        return pages;
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
