/* ===================================
   auth.js - Authentication Logic
   =================================== */

// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'maggiepoint.onessa.agency' || window.location.hostname === 'www.maggiepoint.onessa.agency' || window.location.hostname === '72.62.199.218'
    ? ''
    : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function () {
    // Determine which page we're on
    const isSignupPage = document.getElementById('signupForm') !== null;
    const isLoginPage = document.getElementById('loginForm') !== null;

    if (isSignupPage) {
        initSignupPage();
    }

    if (isLoginPage) {
        initLoginPage();
    }

    // Common functionality
    initPasswordToggles();
});

/* === SIGNUP PAGE === */
function initSignupPage() {
    const form = document.getElementById('signupForm');
    const floorSelect = document.getElementById('floor');
    const roomSelect = document.getElementById('room');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const emailInput = document.getElementById('email');
    const otpGroup = document.getElementById('otpGroup');

    // Floor and Room Selection
    floorSelect.addEventListener('change', function () {
        const floor = this.value;
        roomSelect.disabled = false;
        roomSelect.innerHTML = '<option value="">Select Room</option>';

        if (floor) {
            // Generate room numbers for selected floor (101-111, 201-211, etc.)
            for (let i = 1; i <= 11; i++) {
                const roomNumber = floor + String(i).padStart(2, '0');
                const option = document.createElement('option');
                option.value = roomNumber;
                option.textContent = `Room ${roomNumber}`;
                roomSelect.appendChild(option);
            }
        } else {
            roomSelect.disabled = true;
            roomSelect.innerHTML = '<option value="">Select floor first</option>';
        }
    });

    // Send OTP Button
    sendOtpBtn.addEventListener('click', async function () {
        const email = emailInput.value.trim();
        const firstName = document.getElementById('firstName').value.trim();

        if (!firstName) {
            showNotification('Please enter your first name first', 'error');
            document.getElementById('firstName').focus();
            return;
        }

        if (!email) {
            showNotification('Please enter your email address', 'error');
            emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }

        // Disable button and show loading
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';

        try {
            // Call backend API
            const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, firstName })
            });

            const data = await response.json();

            if (response.ok) {
                otpGroup.style.display = 'block';
                sendOtpBtn.textContent = 'Resend OTP';
                sendOtpBtn.disabled = false;
                showNotification('OTP sent to your email!', 'success');

                // Start timer
                startOtpTimer(300); // 5 minutes
            } else {
                throw new Error(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('OTP Error:', error);
            showNotification(error.message || 'Failed to send OTP. Please try again.', 'error');
            sendOtpBtn.textContent = 'Send OTP';
            sendOtpBtn.disabled = false;
        }
    });

    // Password Strength Indicator
    passwordInput.addEventListener('input', function () {
        updatePasswordStrength(this.value);
    });

    // Form Submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate all fields
        if (!validateSignupForm()) {
            return;
        }

        // Get form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: emailInput.value.trim(),
            otp: document.getElementById('otp').value.trim(),
            floor: parseInt(floorSelect.value),
            room: roomSelect.value,
            password: passwordInput.value
        };

        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Save token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showNotification('Account created successfully! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'menu.html';
                }, 2000);
            } else {
                throw new Error(data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            showNotification(error.message || 'Signup failed. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/* === LOGIN PAGE === */
function initLoginPage() {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showNotification('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'menu.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login Error:', error);
            showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

/* === PASSWORD TOGGLES === */
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type');

            if (type === 'password') {
                input.setAttribute('type', 'text');
                this.querySelector('.eye-icon').textContent = '👁️‍🗨️';
            } else {
                input.setAttribute('type', 'password');
                this.querySelector('.eye-icon').textContent = '👁️';
            }
        });
    });
}

/* === PASSWORD STRENGTH === */
function updatePasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    if (!strengthFill || !strengthText) return;

    if (password.length === 0) {
        strengthFill.className = 'strength-fill';
        strengthText.className = 'strength-text';
        strengthText.textContent = 'Enter password';
        return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Determine strength level
    let level = 'weak';
    let text = 'Weak password';

    if (strength >= 4) {
        level = 'medium';
        text = 'Medium password';
    }
    if (strength >= 6) {
        level = 'strong';
        text = 'Strong password';
    }

    strengthFill.className = `strength-fill ${level}`;
    strengthText.className = `strength-text ${level}`;
    strengthText.textContent = text;
}

/* === OTP TIMER === */
function startOtpTimer(seconds) {
    const timerElement = document.getElementById('otpTimer');
    if (!timerElement) return;

    let remaining = seconds;

    const interval = setInterval(() => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerElement.textContent = `Code expires in ${minutes}:${secs.toString().padStart(2, '0')}`;

        remaining--;

        if (remaining < 0) {
            clearInterval(interval);
            timerElement.textContent = 'Code expired. Please request a new one.';
            timerElement.classList.remove('success');
            timerElement.style.color = 'var(--error)';
        }
    }, 1000);
}

/* === VALIDATION === */
function validateSignupForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const otp = document.getElementById('otp').value.trim();
    const floor = document.getElementById('floor').value;
    const room = document.getElementById('room').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    if (!firstName || !lastName) {
        showNotification('Please enter your full name', 'error');
        return false;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }

    if (!otp || otp.length !== 6) {
        showNotification('Please enter the 6-digit OTP', 'error');
        return false;
    }

    if (!floor || !room) {
        showNotification('Please select your floor and room', 'error');
        return false;
    }

    if (password.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return false;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return false;
    }

    if (!terms) {
        showNotification('Please accept the terms and conditions', 'error');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/* === NOTIFICATION SYSTEM === */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles if not already added
    if (!document.querySelector('style[data-notification-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification-styles', 'true');
        style.textContent = `
            .notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                padding: 1rem 1.5rem;
                background: white;
                border-radius: 0.75rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                font-weight: 600;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            
            .notification-info {
                border-left: 4px solid #3b82f6;
                color: #1e40af;
            }
            
            .notification-success {
                border-left: 4px solid #10b981;
                color: #065f46;
            }
            
            .notification-error {
                border-left: 4px solid #ef4444;
                color: #991b1b;
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @media (max-width: 768px) {
                .notification {
                    left: 1rem;
                    right: 1rem;
                    top: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}
