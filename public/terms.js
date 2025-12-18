// Load effective date and update notice from the page's meta data
async function loadTermsMetadata() {
    try {
        const response = await fetch('/api/terms-metadata');
        const data = await response.json();
        
        // Set effective date
        document.getElementById('effectiveDate').textContent = data.effectiveDate || '2025-12-01';
        document.getElementById('lastReviewed').textContent = data.effectiveDate || '2025-12-01';
        
        // Set update notice if present
        if (data.updateNotice && data.updateNotice.trim() !== '') {
            document.getElementById('updateNotice').textContent = data.updateNotice;
            document.getElementById('updateNoticeContainer').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Failed to load terms metadata:', error);
        // Fallback values
        document.getElementById('effectiveDate').textContent = '2025-12-01';
        document.getElementById('lastReviewed').textContent = '2025-12-01';
    }
}

// Load metadata when page loads
document.addEventListener('DOMContentLoaded', loadTermsMetadata);
