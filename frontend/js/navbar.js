/* ===================================
   NAVBAR & AUTH LOGIC
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAuthAndNav();
    initSmartButtons();
});

function initAuthAndNav() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!token;

    updateNavbarUI(isLoggedIn, user);
    initMobileToggle();
}

function updateNavbarUI(isLoggedIn, user) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    if (isLoggedIn) {
        // Logged in: Show Profile + Logout
        navActions.innerHTML = `
            <a href="/profile" class="btn btn-outline btn-small" style="display:none;">Profile</a>
            <button id="logoutBtn" class="btn btn-outline btn-small">Logout</button>
            <button class="mobile-menu-toggle" id="mobileToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            });
        }
    } else {
        // Logged out: Show Login + Signup
        navActions.innerHTML = `
            <a href="/login" class="btn btn-ghost">Log In</a>
            <a href="/signup" class="btn btn-primary">Sign Up</a>
            <button class="mobile-menu-toggle" id="mobileToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        `;
    }

    // Re-initialize mobile menu after updating HTML
    initMobileToggle();
}

function initMobileToggle() {
    const toggle = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    // Remove old listeners by cloning
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    newToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        newToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !newToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            newToggle.classList.remove('active');
        }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            newToggle.classList.remove('active');
        });
    });
}

// Smart button redirects
function initSmartButtons() {
    // Handle all "Order Now" or similar CTA buttons
    document.querySelectorAll('[data-smart-redirect]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const isLoggedIn = !!localStorage.getItem('token');
            const target = btn.getAttribute('data-smart-redirect');

            if (isLoggedIn) {
                // Logged in: Go to menu
                window.location.href = '/menu';
            } else {
                // Not logged in: Go to signup or specified target
                window.location.href = target || '/signup';
            }
        });
    });
}
