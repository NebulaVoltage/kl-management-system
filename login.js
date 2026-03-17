/* =============================================
   KLH STUDENT PORTAL — login.js
   Mock Authentication System
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // If already authenticated, skip login
    if (localStorage.getItem('isAuthenticated') === 'true') {
        window.location.href = 'index.html';
        return;
    }

    // Restore dark mode preference on login page too
    if (localStorage.getItem('klh_dark_mode') === 'true') {
        document.body.classList.add('dark');
    }

    const form = document.getElementById('login-form');
    const idInput = document.getElementById('login-id');
    const passwordInput = document.getElementById('login-password');
    const captchaDisplay = document.getElementById('captcha-display');
    const captchaInput = document.getElementById('captcha-input');
    const captchaRefresh = document.getElementById('captcha-refresh');
    const loginBtn = document.getElementById('login-btn');
    const loginBtnText = document.getElementById('login-btn-text');
    const loginSpinner = document.getElementById('login-spinner');
    const loginError = document.getElementById('login-error');

    let captchaCode = '';

    // Generate random 5-char alphanumeric CAPTCHA
    function generateCaptcha() {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        captchaCode = '';
        for (let i = 0; i < 5; i++) {
            captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaDisplay.textContent = captchaCode;
        captchaInput.value = '';
    }

    generateCaptcha();
    captchaRefresh.addEventListener('click', generateCaptcha);

    function showError(msg) {
        loginError.textContent = msg;
        loginError.classList.remove('hidden');
        loginError.style.animation = 'none';
        loginError.offsetHeight; // reflow
        loginError.style.animation = 'shake 0.4s ease';
    }

    function hideError() {
        loginError.classList.add('hidden');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        const id = idInput.value.trim();
        const password = passwordInput.value.trim();
        const captchaVal = captchaInput.value.trim();

        if (!id || !password) {
            showError('Please fill in both University ID and Password.');
            return;
        }

        if (captchaVal !== captchaCode) {
            showError('CAPTCHA does not match. Please try again.');
            generateCaptcha();
            return;
        }

        // Mock authentication — show spinner
        loginBtn.disabled = true;
        loginBtnText.textContent = 'Authenticating...';
        loginSpinner.classList.remove('hidden');

        // Simulate API call with 1.5s delay
        new Promise((resolve) => setTimeout(resolve, 1500))
            .then(() => {
                // Store session
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('studentId', id);
                // Redirect to dashboard
                window.location.href = 'index.html';
            });
    });
});
