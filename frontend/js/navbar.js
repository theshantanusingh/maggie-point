/* ===================================
   NAVBAR & AUTH HANDLER
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
});

function updateNavbar() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const navButtons = document.getElementById('navButtons');

    if (!navButtons) return;

    if (token && userStr) {
        // User is logged in
        try {
            const user = JSON.parse(userStr);
            const firstName = user.firstName || 'User';
            const initial = firstName.charAt(0).toUpperCase();

            navButtons.innerHTML = `
                <a href="/settings" class="btn btn-outline" style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 28px; height: 28px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">${initial}</span>
                    <span>${firstName}</span>
                </a>
            `;
        } catch (e) {
            console.error('Error parsing user:', e);
            showLoggedOutNav();
        }
    } else {
        // User is logged out
        showLoggedOutNav();
    }
}

function showLoggedOutNav() {
    const navButtons = document.getElementById('navButtons');
    if (navButtons) {
        navButtons.innerHTML = `
            <a href="/login" class="btn btn-outline">Login</a>
            <a href="/signup" class="btn btn-primary">Sign Up</a>
        `;
    }
}

// Export for use in other scripts
window.updateNavbar = updateNavbar;
