// Variant 3 configuration — Gradient Glass
window.VARIANT_CONFIG = {
    baseCardClass: 'glass-card',
    riskClassMap: {
        'Low risk':    'result-low',
        'Medium risk': 'result-medium',
        'High risk':   'result-high'
    },
    badgeClass: 'glass-badge',
    badgeClassMap: {
        'Low risk':    'risk-low',
        'Medium risk': 'risk-medium',
        'High risk':   'risk-high',
        _default:      'risk-default'
    },
    simCardClass: 'sim-card',
    simBadgeClass: 'glass-badge',
    submitLabel: '<i class="bi bi-calculator me-2"></i>Calculate Credit Score'
};
