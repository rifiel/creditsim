// Variant 2 configuration — Clean Minimal
window.VARIANT_CONFIG = {
    baseCardClass: 'clean-card',
    riskClassMap: {
        'Low risk':    'result-card-low',
        'Medium risk': 'result-card-medium',
        'High risk':   'result-card-high'
    },
    badgeClass: 'risk-pill',
    badgeClassMap: {
        'Low risk':    'risk-low',
        'Medium risk': 'risk-medium',
        'High risk':   'risk-high',
        _default:      'risk-default'
    },
    simCardClass: 'sim-item',
    simBadgeClass: 'risk-pill',
    submitLabel: '<i class="bi bi-calculator me-2"></i>Calculate Credit Score'
};
