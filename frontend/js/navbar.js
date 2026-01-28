/* ===================================
   SIMPLE RESPONSIVE NAVBAR & AUTH
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAuthAndNav();
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
    const navLinks = document.querySelector('.nav-links');

    // Clear existing nav actions but keep the toggle button
    // We recreate functionality to ensure it works

    if (isLoggedIn) {
        // Logged In State
        // Add "Profile" link to nav-links if not present
        if (!document.querySelector('a[href="/profile"]')) {
            const profileLink = document.createElement('a');
            profileLink.href = '/profile.html'; // We'll create this later
            profileLink.className = 'nav-link';
            profileLink.textContent = 'Profile';
            // Insert before the last item or specific position
            navLinks.appendChild(profileLink);
        }

        navActions.innerHTML = `
            <div class="user-greeting" style="color:white; font-size:0.9rem; margin-right:1rem; display:none;">
                Hi, ${user.firstName || 'User'}
            </div>
            <button id="logoutBtn" class="btn btn-outline btn-small">Logout</button>
            <button class="mobile-menu-toggle" id="mobileToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        `;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });

    } else {
        // Logged Out State
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
}

function initMobileToggle() {
    // Determine the toggle button - it might have been re-rendered
    const toggleBtn = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions'); // For mobile alignment

    if (toggleBtn && navLinks) {
        // Remove old event listeners to prevent duplicates
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            newBtn.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !newBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                newBtn.classList.remove('active');
            }
        });
    }
}
