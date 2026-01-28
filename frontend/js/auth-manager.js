/* ===================================
   Auth State Manager
   Handles user authentication state across all pages
   =================================== */

class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    init() {
        // Load from localStorage
        this.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                this.user = JSON.parse(userStr);
            } catch (e) {
                this.clearAuth();
            }
        }
    }

    isLoggedIn() {
        return !!(this.token && this.user);
    }

    isAdmin() {
        return this.isLoggedIn() && this.user.isAdmin === true;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    logout() {
        this.clearAuth();
        window.location.href = '/';
    }

    // Update navbar based on auth state
    updateNavbar() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        if (this.isLoggedIn()) {
            const userName = `${this.user.firstName} ${this.user.lastName}`;
            const userInitial = this.user.firstName?.[0] || 'U';

            navActions.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-btn" id="userMenuBtn">
                        <span class="user-avatar">${userInitial}</span>
                        <span class="user-name">${userName}</span>
                        <span class="user-chevron">▼</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        ${this.isAdmin() ? '<a href="/admin" class="dropdown-item">👑 Admin Panel</a>' : ''}
                        <a href="#" class="dropdown-item">👤 Profile</a>
                        <a href="#" class="dropdown-item">📦 Orders</a>
                        <hr class="dropdown-divider">
                        <a href="#" class="dropdown-item" id="logoutBtn">🚪 Logout</a>
                    </div>
                </div>
                <button class="mobile-menu-toggle" id="mobileMenuToggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            `;

            // Add dropdown functionality
            const menuBtn = document.getElementById('userMenuBtn');
            const dropdown = document.getElementById('userDropdown');
            const logoutBtn = document.getElementById('logoutBtn');

            if (menuBtn && dropdown) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                });

                document.addEventListener('click', () => {
                    dropdown.classList.remove('active');
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        } else {
            navActions.innerHTML = `
                <a href="/login" class="btn btn-ghost">Log In</a>
                <a href="/signup" class="btn btn-primary">Sign Up</a>
                <button class="mobile-menu-toggle" id="mobileMenuToggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            `;
        }

        // Re-init mobile menu after updating navbar
        this.initMobileMenu();
    }

    initMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');

        if (toggle && navLinks) {
            // Remove old listeners by cloning
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            newToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                newToggle.classList.toggle('active');
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    newToggle.classList.remove('active');
                });
            });
        }
    }

    // Protect routes that require authentication
    requireAuth(redirectTo = '/login') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    // Protect admin routes
    requireAdmin(redirectTo = '/') {
        if (!this.isAdmin()) {
            alert('Access denied. Admin privileges required.');
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    // Redirect if already logged in (for login/signup pages)
    redirectIfLoggedIn(redirectTo = '/') {
        if (this.isLoggedIn()) {
            window.location.href = redirectTo;
            return true;
        }
        return false;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Auto-update navbar on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager) {
        window.authManager.updateNavbar();
    }
});
