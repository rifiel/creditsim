// What's New Page JavaScript

class WhatsNewPage {
    constructor() {
        this.updatesContainer = document.getElementById('updatesContainer');
        this.init();
    }

    async init() {
        await this.loadUpdates();
    }

    async loadUpdates() {
        try {
            const response = await fetch('/data/whats-new.json');
            
            if (!response.ok) {
                throw new Error('Failed to load updates');
            }

            const updates = await response.json();
            this.renderUpdates(updates);
        } catch (error) {
            this.showError(error.message);
        }
    }

    renderUpdates(updates) {
        if (!updates || updates.length === 0) {
            this.showEmptyState();
            return;
        }

        // Sort updates by date (newest first)
        const sortedUpdates = [...updates].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        const updatesHtml = sortedUpdates.map(update => this.createUpdateCard(update)).join('');
        
        this.updatesContainer.innerHTML = `
            <div class="row">
                ${updatesHtml}
            </div>
        `;
    }

    createUpdateCard(update) {
        const formattedDate = this.formatDate(update.date);
        const hasImage = update.imageUrl && update.imageUrl.trim() !== '';
        
        let imageHtml = '';
        if (hasImage) {
            imageHtml = `
                <img src="${this.escapeHtml(update.imageUrl)}" 
                     class="card-img-top update-image" 
                     alt="${this.escapeHtml(update.imageAlt)}"
                     loading="lazy">
            `;
        }

        let linksHtml = '';
        if (update.links && update.links.length > 0) {
            const linkItems = update.links.map(link => `
                <a href="${this.escapeHtml(link.url)}" class="btn btn-outline-primary btn-sm">
                    ${this.escapeHtml(link.label)}
                </a>
            `).join(' ');
            linksHtml = `
                <div class="mt-3">
                    ${linkItems}
                </div>
            `;
        }

        return `
            <div class="col-12 mb-4">
                <article class="card update-card h-100">
                    ${imageHtml}
                    <div class="card-body">
                        <h2 class="card-title h4">
                            ${this.escapeHtml(update.title)}
                        </h2>
                        <p class="update-date">
                            <i class="bi bi-calendar-event"></i>
                            <time datetime="${update.date}">${formattedDate}</time>
                        </p>
                        <p class="card-text">
                            ${this.escapeHtml(update.summary)}
                        </p>
                        ${update.details ? `
                            <p class="card-text text-muted">
                                ${this.escapeHtml(update.details)}
                            </p>
                        ` : ''}
                        ${linksHtml}
                    </div>
                </article>
            </div>
        `;
    }

    showEmptyState() {
        this.updatesContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 4rem; color: #dee2e6;"></i>
                <h2 class="h4 mt-3">No updates yet</h2>
                <p class="text-muted">
                    Check back soon for news about new features and improvements.
                </p>
            </div>
        `;
    }

    showError(message) {
        this.updatesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Error loading updates:</strong> ${this.escapeHtml(message)}
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the What's New page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WhatsNewPage();
});
