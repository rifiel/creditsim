// Shared Credit Simulator logic for all design variants.
// Each variant configures VARIANT_CONFIG before loading this script:
//   window.VARIANT_CONFIG = { baseCardClass, riskClassMap, badgeClass, submitLabel }

(function () {
    'use strict';

    const cfg = window.VARIANT_CONFIG || {
        baseCardClass: 'card',
        riskClassMap: { 'Low risk': 'low-risk', 'Medium risk': 'medium-risk', 'High risk': 'high-risk' },
        badgeClassMap: { 'Low risk': 'risk-low', 'Medium risk': 'risk-medium', 'High risk': 'risk-high', _default: 'risk-default' },
        submitLabel: '<i class="bi bi-calculator me-2"></i>Calculate Credit Score'
    };

    class CreditSimulator {
        constructor() {
            this.form            = document.getElementById('creditForm');
            this.resultCard      = document.getElementById('resultCard');
            this.errorCard       = document.getElementById('errorCard');
            this.placeholderCard = document.getElementById('placeholderCard');
            this.simulationsList = document.getElementById('simulationsList');
            this.refreshBtn      = document.getElementById('refreshBtn');
            this.init();
        }

        init() {
            this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
            this.refreshBtn.addEventListener('click', this.loadSimulations.bind(this));
            this.loadSimulations();
            this.setupLoanSlider();
        }

        setupLoanSlider() {
            const slider  = document.getElementById('loanAmount');
            const display = document.getElementById('loanAmountDisplay');
            const hidden  = document.getElementById('loanAmountValue');
            slider.addEventListener('input', function (e) {
                const v = parseInt(e.target.value);
                display.textContent = '$' + v.toLocaleString();
                hidden.value = v;
            });
        }

        async handleFormSubmit(e) {
            e.preventDefault();
            this.hideCards();
            this.showLoading();
            try {
                const data = this.getFormData();
                const res  = await this.submitSimulation(data);
                this.showResult(res);
                this.loadSimulations();
            } catch (err) {
                this.showError(err.message);
            } finally {
                this.hideLoading();
            }
        }

        getFormData() {
            const fd = new FormData(this.form);
            const d  = {};
            for (const [k, v] of fd.entries()) {
                if (k === 'loanAmountValue') continue;
                if (k === 'name')            d[k] = v.trim();
                else if (k === 'age')        d[k] = parseInt(v);
                else if (k === 'annualIncome' || k === 'debtToIncomeRatio') d[k] = parseFloat(v);
                else if (k === 'loanAmount') d[k] = parseInt(v);
                else                         d[k] = v;
            }
            return d;
        }

        async submitSimulation(data) {
            const res  = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to calculate credit score');
            return json;
        }

        async loadSimulations() {
            try {
                const res  = await fetch('/api/simulations');
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load simulations');
                this.renderSimulations(data.simulations);
            } catch (err) {
                this.simulationsList.innerHTML =
                    '<div class="empty-state" style="color:#ef4444;">' + this.escapeHtml(err.message) + '</div>';
            }
        }

        renderSimulations(sims) {
            if (!sims.length) {
                this.simulationsList.innerHTML =
                    '<div class="empty-state"><i class="bi bi-inbox" style="font-size:1.5rem;display:block;margin-bottom:6px;"></i>No simulations yet \u2014 run your first above!</div>';
                return;
            }
            const simCardClass = cfg.simCardClass || 'sim-card';
            const badgeClass   = cfg.simBadgeClass || cfg.badgeClass || 'glass-badge';
            const html = sims.map(s => {
                const bc = this.getBadgeCls(s.riskCategory);
                return '<div class="col-md-6 col-lg-4 mb-3">' +
                    '<div class="' + simCardClass + '">' +
                    '<div class="d-flex justify-content-between align-items-start mb-2">' +
                    '<div class="sim-name">' + this.escapeHtml(s.name) + '</div>' +
                    '<span class="' + badgeClass + ' ' + bc + '" style="font-size:0.7rem;padding:3px 10px;">' + s.riskCategory + '</span>' +
                    '</div>' +
                    '<div class="d-flex justify-content-between align-items-end">' +
                    '<div><div class="sim-score">' + s.score + '</div><div class="sim-meta">Credit Score</div></div>' +
                    '<div class="text-end"><div class="sim-loan">$' + s.loanAmount.toLocaleString() + '</div><div class="sim-meta">Loan</div></div>' +
                    '</div>' +
                    '<div class="sim-meta mt-2"><i class="bi bi-calendar3 me-1"></i>' + this.formatDate(s.createdAt) + '</div>' +
                    '</div></div>';
            }).join('');
            this.simulationsList.innerHTML = '<div class="row">' + html + '</div>';
        }

        showResult(result) {
            const { score, riskCategory, customer } = result;
            document.getElementById('scoreNumber').textContent      = score;
            document.getElementById('customerName').textContent     = 'for ' + customer.name;
            document.getElementById('resultLoanAmount').textContent = '$' + customer.loanAmount.toLocaleString();
            document.getElementById('resultIncome').textContent     = '$' + customer.annualIncome.toLocaleString();

            const badge = document.getElementById('riskCategory');
            badge.textContent = riskCategory;
            const bc = this.getBadgeCls(riskCategory);
            badge.className   = (cfg.badgeClass || 'glass-badge') + ' ' + bc;

            const riskExtra = (cfg.riskClassMap && cfg.riskClassMap[riskCategory]) || '';
            this.resultCard.className = (cfg.baseCardClass || 'card') + (riskExtra ? ' ' + riskExtra : '');
            this.resultCard.classList.remove('d-none');
            if (this.placeholderCard) this.placeholderCard.classList.add('d-none');
        }

        showError(msg) {
            document.getElementById('errorMessage').textContent = msg;
            this.errorCard.classList.remove('d-none');
            if (this.placeholderCard) this.placeholderCard.classList.add('d-none');
        }

        hideCards() {
            this.resultCard.classList.add('d-none');
            this.errorCard.classList.add('d-none');
        }

        showLoading() {
            const btn = this.form.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Calculating\u2026';
            btn.disabled = true;
        }

        hideLoading() {
            const btn = this.form.querySelector('button[type="submit"]');
            btn.innerHTML = cfg.submitLabel || '<i class="bi bi-calculator me-2"></i>Calculate Credit Score';
            btn.disabled = false;
        }

        getBadgeCls(cat) {
            if (!cfg.badgeClassMap) {
                const defaultMap = { 'Low risk': 'risk-low', 'Medium risk': 'risk-medium', 'High risk': 'risk-high' };
                return defaultMap[cat] || 'risk-default';
            }
            return cfg.badgeClassMap[cat] || cfg.badgeClassMap._default || 'risk-default';
        }

        formatDate(ds) {
            const d = new Date(ds);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    document.addEventListener('DOMContentLoaded', function () { new CreditSimulator(); });
}());
