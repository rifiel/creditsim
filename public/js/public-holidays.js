/**
 * Public Holidays Frontend JavaScript
 * Uses jQuery for DOM manipulation and AJAX calls
 */

(function($) {
    'use strict';

    class PublicHolidaysApp {
        constructor() {
            this.form = $('#holidaysForm');
            this.countrySelect = $('#countrySelect');
            this.yearInput = $('#yearInput');
            this.loadBtn = $('#loadBtn');
            this.alertPlaceholder = $('#alertPlaceholder');
            this.loadingState = $('#loadingState');
            this.emptyState = $('#emptyState');
            this.tableContainer = $('#tableContainer');
            this.tableBody = $('#holidaysTableBody');
            this.holidayCount = $('#holidayCount');
            
            // Simple in-memory cache for session
            this.cache = {};
            
            this.init();
        }

        init() {
            // Set default year to current year
            const currentYear = new Date().getFullYear();
            this.yearInput.val(currentYear);

            // Load countries on page load
            this.loadCountries();

            // Handle form submission
            this.form.on('submit', (e) => {
                e.preventDefault();
                this.loadHolidays();
            });

            // Auto-load on country or year change
            this.countrySelect.on('change', () => {
                if (this.countrySelect.val()) {
                    this.loadHolidays();
                }
            });
        }

        /**
         * Load list of countries from API
         */
        async loadCountries() {
            try {
                const response = await $.ajax({
                    url: '/api/public-holidays/countries',
                    method: 'GET',
                    dataType: 'json'
                });

                if (response && response.countries) {
                    this.populateCountrySelect(response.countries);
                    
                    // Set default country (US or first available)
                    const defaultCountry = 'US';
                    if (response.countries.some(c => c.code === defaultCountry)) {
                        this.countrySelect.val(defaultCountry);
                    } else if (response.countries.length > 0) {
                        this.countrySelect.val(response.countries[0].code);
                    }

                    // Auto-load holidays for default selection
                    this.loadHolidays();
                }
            } catch (error) {
                console.error('Failed to load countries:', error);
                this.showError('Failed to load country list. Please refresh the page.');
                this.countrySelect.html('<option value="">Error loading countries</option>');
            }
        }

        /**
         * Populate country select dropdown
         * @param {Array} countries - Array of country objects
         */
        populateCountrySelect(countries) {
            this.countrySelect.empty();
            this.countrySelect.append('<option value="">Select a country...</option>');
            
            countries.forEach(country => {
                this.countrySelect.append(
                    $('<option></option>')
                        .val(country.code)
                        .text(`${country.name} (${country.code})`)
                );
            });
        }

        /**
         * Load holidays for selected country and year
         */
        async loadHolidays() {
            const country = this.countrySelect.val();
            const year = this.yearInput.val();

            if (!country || !year) {
                return;
            }

            // Check cache first
            const cacheKey = `${country}:${year}`;
            if (this.cache[cacheKey]) {
                this.renderHolidays(this.cache[cacheKey]);
                return;
            }

            this.showLoading();
            this.hideAlert();

            try {
                const response = await $.ajax({
                    url: '/api/public-holidays',
                    method: 'GET',
                    data: { country, year },
                    dataType: 'json'
                });

                if (response) {
                    // Cache the result
                    this.cache[cacheKey] = response;
                    this.renderHolidays(response);
                }
            } catch (error) {
                console.error('Failed to load holidays:', error);
                
                let errorMessage = 'Failed to load holidays. Please try again.';
                if (error.responseJSON && error.responseJSON.message) {
                    errorMessage = error.responseJSON.message;
                }
                
                this.showError(errorMessage);
                this.hideLoading();
            }
        }

        /**
         * Render holidays in the table
         * @param {Object} data - Holidays data object
         */
        renderHolidays(data) {
            this.hideLoading();

            if (!data.holidays || data.holidays.length === 0) {
                this.showEmpty();
                return;
            }

            // Sort holidays by date
            const sortedHolidays = data.holidays.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });

            // Render rows
            this.tableBody.empty();
            sortedHolidays.forEach(holiday => {
                const row = this.createHolidayRow(holiday);
                this.tableBody.append(row);
            });

            // Update count and show table
            this.holidayCount.text(sortedHolidays.length);
            this.showTable();
        }

        /**
         * Create a table row for a holiday
         * @param {Object} holiday - Holiday object
         * @returns {jQuery} - Table row element
         */
        createHolidayRow(holiday) {
            const tr = $('<tr></tr>').addClass('holiday-row');
            
            // Date column
            tr.append(
                $('<td></td>').text(this.formatDate(holiday.date))
            );

            // Name column
            tr.append(
                $('<td></td>').text(holiday.name || '-')
            );

            // Local name column
            tr.append(
                $('<td></td>').text(holiday.localName || '-')
            );

            // Type column
            tr.append(
                $('<td></td>').text(holiday.type || '-')
            );

            // Notes column
            const notes = holiday.notes || (holiday.observed ? 'Observed' : '');
            tr.append(
                $('<td></td>').text(notes || '-')
            );

            return tr;
        }

        /**
         * Format date string for display
         * @param {string} dateString - ISO date string (YYYY-MM-DD)
         * @returns {string} - Formatted date
         */
        formatDate(dateString) {
            const date = new Date(dateString + 'T00:00:00');
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }

        /**
         * Show loading state
         */
        showLoading() {
            this.disableControls();
            this.loadingState.removeClass('d-none');
            this.emptyState.addClass('d-none');
            this.tableContainer.addClass('d-none');
        }

        /**
         * Hide loading state
         */
        hideLoading() {
            this.enableControls();
            this.loadingState.addClass('d-none');
        }

        /**
         * Show empty state
         */
        showEmpty() {
            this.emptyState.removeClass('d-none');
            this.tableContainer.addClass('d-none');
        }

        /**
         * Show table
         */
        showTable() {
            this.emptyState.addClass('d-none');
            this.tableContainer.removeClass('d-none');
        }

        /**
         * Show error alert
         * @param {string} message - Error message
         */
        showError(message) {
            const alert = $(`
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>Error:</strong> ${this.escapeHtml(message)}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
            
            this.alertPlaceholder.html(alert);
        }

        /**
         * Hide alert
         */
        hideAlert() {
            this.alertPlaceholder.empty();
        }

        /**
         * Disable form controls
         */
        disableControls() {
            this.countrySelect.prop('disabled', true);
            this.yearInput.prop('disabled', true);
            this.loadBtn.prop('disabled', true);
            this.loadBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Loading...');
        }

        /**
         * Enable form controls
         */
        enableControls() {
            this.countrySelect.prop('disabled', false);
            this.yearInput.prop('disabled', false);
            this.loadBtn.prop('disabled', false);
            this.loadBtn.html('<i class="bi bi-search"></i> Load Holidays');
        }

        /**
         * Escape HTML to prevent XSS
         * @param {string} text - Text to escape
         * @returns {string} - Escaped text
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Initialize app when DOM is ready
    $(document).ready(() => {
        new PublicHolidaysApp();
    });

})(jQuery);
