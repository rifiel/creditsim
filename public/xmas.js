// Christmas Landing Page JavaScript

class XmasPage {
    constructor() {
        // Greeting module refs
        this.greetingForm = document.getElementById('greetingForm');
        this.greetingPreview = document.getElementById('greetingPreview');
        this.greetingContent = document.getElementById('greetingContent');
        this.greetingAlert = document.getElementById('greetingAlert');
        
        // Wishlist module refs
        this.wishlistForm = document.getElementById('wishlistForm');
        this.wishlistItems = document.getElementById('wishlistItems');
        this.emptyWishlist = document.getElementById('emptyWishlist');
        this.wishlistAlert = document.getElementById('wishlistAlert');
        
        // Offers container
        this.offersContainer = document.getElementById('offersContainer');
        
        // Wishlist state (in-memory only)
        this.wishlist = [];
        
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.greetingForm.addEventListener('submit', this.handleGreetingSubmit.bind(this));
        this.wishlistForm.addEventListener('submit', this.handleWishlistSubmit.bind(this));
        
        // Initialize snow animation if motion is not reduced
        this.initSnowAnimation();
        
        // Load offers
        this.loadOffers();
        
        // Update empty state
        this.updateWishlistDisplay();
    }
    
    // ========== Greeting Module ==========
    
    handleGreetingSubmit(e) {
        e.preventDefault();
        
        // Clear previous alerts
        this.clearAlert(this.greetingAlert);
        
        // Get and validate input
        const userName = document.getElementById('userName').value.trim();
        const message = document.getElementById('greetingMessage').value.trim();
        
        // Validate name
        const nameValidation = this.validateName(userName);
        if (!nameValidation.valid) {
            this.showFieldError('userName', nameValidation.error);
            this.showAlert(this.greetingAlert, nameValidation.error, 'danger');
            return;
        }
        
        // Validate message (optional)
        if (message) {
            const messageValidation = this.validateMessage(message);
            if (!messageValidation.valid) {
                this.showFieldError('greetingMessage', messageValidation.error);
                this.showAlert(this.greetingAlert, messageValidation.error, 'danger');
                return;
            }
        }
        
        // Clear any field errors
        this.clearFieldError('userName');
        this.clearFieldError('greetingMessage');
        
        // Render greeting preview
        this.renderGreeting(userName, message);
        
        // Show success message
        this.showAlert(this.greetingAlert, 'Your holiday greeting has been created!', 'success');
    }
    
    validateName(name) {
        if (!name || name.length === 0) {
            return { valid: false, error: 'Please enter your name.' };
        }
        if (name.length > 50) {
            return { valid: false, error: 'Name must be 50 characters or less.' };
        }
        // Block control characters
        if (/[\x00-\x1F\x7F]/.test(name)) {
            return { valid: false, error: 'Name contains invalid characters.' };
        }
        return { valid: true };
    }
    
    validateMessage(message) {
        if (message.length > 100) {
            return { valid: false, error: 'Message must be 100 characters or less.' };
        }
        // Block control characters
        if (/[\x00-\x1F\x7F]/.test(message)) {
            return { valid: false, error: 'Message contains invalid characters.' };
        }
        return { valid: true };
    }
    
    renderGreeting(name, message) {
        // Use textContent to safely insert user input
        const greetingHTML = document.createElement('div');
        
        const heading = document.createElement('p');
        heading.className = 'fs-4 fw-bold text-success mb-2';
        heading.textContent = `Happy Holidays, ${name}! 🎄`;
        
        greetingHTML.appendChild(heading);
        
        if (message) {
            const messageP = document.createElement('p');
            messageP.className = 'fst-italic';
            messageP.textContent = message;
            greetingHTML.appendChild(messageP);
        }
        
        const footer = document.createElement('p');
        footer.className = 'text-muted small mt-3 mb-0';
        footer.textContent = 'Wishing you joy and happiness this holiday season!';
        greetingHTML.appendChild(footer);
        
        // Clear and update content
        this.greetingContent.innerHTML = '';
        this.greetingContent.appendChild(greetingHTML);
        
        // Show preview
        this.greetingPreview.classList.remove('d-none');
    }
    
    // ========== Wishlist Module ==========
    
    handleWishlistSubmit(e) {
        e.preventDefault();
        
        // Clear previous alerts
        this.clearAlert(this.wishlistAlert);
        
        // Get and validate input
        const wishItem = document.getElementById('wishItem').value.trim();
        
        // Validate item
        const validation = this.validateWishItem(wishItem);
        if (!validation.valid) {
            this.showFieldError('wishItem', validation.error);
            this.showAlert(this.wishlistAlert, validation.error, 'danger');
            return;
        }
        
        // Clear field error
        this.clearFieldError('wishItem');
        
        // Add to wishlist
        this.addWishItem(wishItem);
        
        // Clear form
        document.getElementById('wishItem').value = '';
        
        // Show success message
        this.showAlert(this.wishlistAlert, 'Item added to your wishlist!', 'success');
        
        // Focus back to input for easy multiple additions
        document.getElementById('wishItem').focus();
    }
    
    validateWishItem(item) {
        if (!item || item.length === 0) {
            return { valid: false, error: 'Please enter an item.' };
        }
        if (item.length > 60) {
            return { valid: false, error: 'Item must be 60 characters or less.' };
        }
        // Block control characters
        if (/[\x00-\x1F\x7F]/.test(item)) {
            return { valid: false, error: 'Item contains invalid characters.' };
        }
        return { valid: true };
    }
    
    addWishItem(item) {
        // Add to state
        const id = Date.now(); // Simple unique ID
        this.wishlist.push({ id, item });
        
        // Update display
        this.updateWishlistDisplay();
    }
    
    removeWishItem(id) {
        // Remove from state
        this.wishlist = this.wishlist.filter(wish => wish.id !== id);
        
        // Update display
        this.updateWishlistDisplay();
        
        // Show alert
        this.showAlert(this.wishlistAlert, 'Item removed from wishlist.', 'info');
    }
    
    updateWishlistDisplay() {
        // Clear list
        this.wishlistItems.innerHTML = '';
        
        if (this.wishlist.length === 0) {
            // Show empty state
            this.emptyWishlist.classList.remove('d-none');
            this.wishlistItems.classList.add('d-none');
        } else {
            // Hide empty state
            this.emptyWishlist.classList.add('d-none');
            this.wishlistItems.classList.remove('d-none');
            
            // Render items
            this.wishlist.forEach((wish, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item wishlist-item d-flex justify-content-between align-items-center';
                
                const itemText = document.createElement('span');
                itemText.textContent = `${index + 1}. ${wish.item}`;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-sm btn-remove';
                removeBtn.setAttribute('aria-label', `Remove ${wish.item} from wishlist`);
                removeBtn.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i> Remove';
                removeBtn.addEventListener('click', () => this.removeWishItem(wish.id));
                
                li.appendChild(itemText);
                li.appendChild(removeBtn);
                
                this.wishlistItems.appendChild(li);
            });
        }
    }
    
    // ========== Offers Module ==========
    
    async loadOffers() {
        try {
            const response = await fetch('/api/xmas/offers');
            
            if (!response.ok) {
                throw new Error('Failed to load offers');
            }
            
            const result = await response.json();
            this.renderOffers(result.data.offers);
            
        } catch (error) {
            console.error('Error loading offers:', error);
            this.offersContainer.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                    Unable to load special offers at this time. Please try again later.
                </div>
            `;
        }
    }
    
    renderOffers(offers) {
        if (!offers || offers.length === 0) {
            this.offersContainer.innerHTML = `
                <div class="text-center text-muted">
                    <i class="bi bi-gift" aria-hidden="true"></i>
                    <p class="mt-2">No special offers available at this time.</p>
                </div>
            `;
            return;
        }
        
        const offersHTML = offers.map(offer => {
            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card offer-card h-100">
                        <div class="card-body">
                            <h3 class="h5 card-title text-success mb-3">
                                <i class="bi bi-tag-fill" aria-hidden="true"></i> ${this.escapeHtml(offer.title)}
                            </h3>
                            <p class="card-text">${this.escapeHtml(offer.description)}</p>
                            <div class="text-center mt-3">
                                <div class="offer-code mb-2" aria-label="Offer code">${this.escapeHtml(offer.code)}</div>
                                <button class="btn btn-copy btn-sm" data-code="${this.escapeHtml(offer.code)}" aria-label="Copy offer code ${this.escapeHtml(offer.code)}">
                                    <i class="bi bi-clipboard" aria-hidden="true"></i> Copy Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.offersContainer.innerHTML = `<div class="row">${offersHTML}</div>`;
        
        // Add copy functionality to all copy buttons
        this.offersContainer.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.currentTarget.getAttribute('data-code');
                this.copyToClipboard(code, e.currentTarget);
            });
        });
    }
    
    copyToClipboard(text, button) {
        // Try modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess(button);
            }).catch(() => {
                this.fallbackCopy(text, button);
            });
        } else {
            this.fallbackCopy(text, button);
        }
    }
    
    fallbackCopy(text, button) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(button);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
        
        document.body.removeChild(textarea);
    }
    
    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i> Copied!';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
    
    // ========== Snow Animation ==========
    
    initSnowAnimation() {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            return; // Don't create snow animation
        }
        
        const snowContainer = document.getElementById('snow-container');
        const snowflakeCount = 50;
        
        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = '❄';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowflake.style.fontSize = (Math.random() * 0.5 + 0.5) + 'em';
            snowflake.style.opacity = Math.random() * 0.6 + 0.4;
            
            snowContainer.appendChild(snowflake);
        }
    }
    
    // ========== Utility Methods ==========
    
    showAlert(alertElement, message, type) {
        alertElement.className = `alert alert-${type} alert-region`;
        alertElement.textContent = message;
    }
    
    clearAlert(alertElement) {
        alertElement.className = 'alert-region';
        alertElement.textContent = '';
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) {
            field.classList.add('is-invalid');
        }
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
    
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) {
            field.classList.remove('is-invalid');
        }
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new XmasPage();
});
