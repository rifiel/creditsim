// Welcome page minor enhancements
document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('footer-year');
    if (el) {
        el.textContent = new Date().getFullYear();
    }
});
