/* ===================================
   MAGGIE POINT - MAIN APP LOGIC
   =================================== */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    initMobileMenu();
    initScrollAnimations();
    initSmoothScroll();
    loadMenu();
});

/* === NAVBAR === */
function initNavbar() {
    const navbar = document.querySelector('.navbar');

    if (!navbar) return;

    // Add scroll effect to navbar
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* === MOBILE MENU === */
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');

    if (!toggle) return;

    toggle.addEventListener('click', function () {
        // Toggle mobile menu
        this.classList.toggle('active');

        // Create mobile menu if it doesn't exist
        let mobileMenu = document.querySelector('.mobile-menu');

        if (!mobileMenu) {
            mobileMenu = document.createElement('div');
            mobileMenu.className = 'mobile-menu';

            // Clone nav links and actions
            if (navLinks) {
                const linksClone = navLinks.cloneNode(true);
                mobileMenu.appendChild(linksClone);
            }

            if (navActions) {
                const actionsClone = navActions.cloneNode(true);
                mobileMenu.appendChild(actionsClone);
            }

            document.querySelector('.navbar').appendChild(mobileMenu);

            // Add mobile menu styles dynamically
            addMobileMenuStyles();
        }

        // Toggle visibility
        if (this.classList.contains('active')) {
            mobileMenu.style.display = 'flex';
            setTimeout(() => {
                mobileMenu.classList.add('open');
            }, 10);
        } else {
            mobileMenu.classList.remove('open');
            setTimeout(() => {
                mobileMenu.style.display = 'none';
            }, 300);
        }
    });
}

function addMobileMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu {
            display: none;
            flex-direction: column;
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: #0f0f0f !important;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            z-index: 999;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-menu.open {
            opacity: 1;
            transform: translateY(0);
        }
        
        .mobile-menu .nav-links {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .mobile-menu .nav-link {
            color: rgba(255, 255, 255, 0.9) !important;
            font-size: 1.1rem !important;
            font-weight: 500;
            text-decoration: none;
        }

        .mobile-menu .nav-link:hover {
            color: #f97316 !important;
        }
        
        .mobile-menu .nav-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .mobile-menu .btn {
            width: 100%;
            justify-content: center;
        }

        .mobile-menu .btn-ghost {
            background: transparent !important;
            color: rgba(255, 255, 255, 0.9) !important;
            border: 2px solid rgba(255, 255, 255, 0.2) !important;
        }

        .mobile-menu .btn-ghost:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
        }

        .mobile-menu .btn-primary {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
            color: #ffffff !important;
            border: none !important;
        }
        
        .mobile-menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    `;
    document.head.appendChild(style);
}

/* === SMOOTH SCROLL === */
function initSmoothScroll() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Skip if it's just "#"
            if (href === '#') {
                e.preventDefault();
                return;
            }

            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();

                const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                const targetPosition = target.offsetTop - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                const toggle = document.querySelector('.mobile-menu-toggle');

                if (mobileMenu && toggle) {
                    toggle.classList.remove('active');
                    mobileMenu.classList.remove('open');
                    setTimeout(() => {
                        mobileMenu.style.display = 'none';
                    }, 300);
                }
            }
        });
    });
}

/* === SCROLL ANIMATIONS === */
function initScrollAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll(`
        .feature-card,
        .menu-item,
        .step,
        .testimonial-card
    `);

    animateElements.forEach((el, index) => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s ease ${index * 0.1}s`;

        // Observe
        observer.observe(el);
    });
}

/* === MENU ITEM INTERACTIONS === */
// Add to cart functionality (placeholder)
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-small') &&
        e.target.textContent.includes('Add to Cart')) {
        e.preventDefault();

        // Show notification
        showNotification('Please sign up to start ordering!', 'info');

        // Redirect to signup after a delay
        setTimeout(() => {
            window.location.href = 'signup.html';
        }, 2000);
    }
});

/* === NOTIFICATION SYSTEM === */
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 2rem;
            padding: 1rem 1.5rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
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
                top: 80px;
            }
        }
    `;

    if (!document.querySelector('style[data-notification-styles]')) {
        style.setAttribute('data-notification-styles', 'true');
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/* === UTILITY FUNCTIONS === */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/* === LOAD MENU FROM API === */
async function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');

    if (!menuGrid) return; // Not on landing page

    try {
        const API_BASE_URL = window.location.hostname === 'maggiepoint.onessa.agency'
            ? ''
            : 'http://localhost:3000';

        const response = await fetch(`${API_BASE_URL}/api/admin/dishes/available`);

        if (!response.ok) {
            throw new Error('Failed to load menu');
        }

        const data = await response.json();
        const dishes = data.dishes || [];

        if (dishes.length === 0) {
            menuGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.6);">No dishes available at the moment. Please check back later!</div>';
            return;
        }

        // Limit to 6 dishes for landing page
        const displayDishes = dishes.slice(0, 6);

        menuGrid.innerHTML = displayDishes.map(dish => `
            <div class="menu-item">
                <div class="menu-item-image">${dish.emoji || '🍜'}</div>
                <div class="menu-item-content">
                    <h3 class="menu-item-title">${dish.name}</h3>
                    <p class="menu-item-desc">${dish.description}</p>
                    <div class="menu-item-footer">
                        <span class="menu-item-price">₹${dish.price}</span>
                        <button class="btn btn-small btn-primary">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load Menu Error:', error);
        menuGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.6);">Unable to load menu. Please try again later.</div>';
    }
}

/* === CONSOLE GREETING === */
console.log('%c🍜 Maggie Point ', 'background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px;');
console.log('%cWelcome to Maggie Point! Built with ❤️ for Amity University students.', 'color: #f97316; font-size: 14px; font-weight: 600;');
