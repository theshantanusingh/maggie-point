/* ===================================
   admin.js - Admin Panel Logic
   =================================== */

const API_BASE_URL = window.location.hostname === 'maggiepoint.onessa.agency' || window.location.hostname === 'www.maggiepoint.onessa.agency'
    ? ''
    : 'http://localhost:3000';

let currentDishId = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    checkAuth();

    // Initialize navigation
    initNavigation();

    // Initialize modals
    initModals();

    // Load dashboard
    loadDashboard();
});

// === AUTHENTICATION ===
function checkAuth() {
    // Check both keys to handle potential legacy/caching issues
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    if (!token) {
        console.warn('No auth token found, redirecting to login');
        window.location.href = '/login';
        return;
    }

    // Store in global variable if needed, or just rely on localStorage
    authToken = token; // Keep global var name for compatibility with rest of file

    // Load user info
    loadUserProfile();
}

async function loadUserProfile() {
    // For now, decode JWT manually or you can call a /me endpoint
    // We'll just display from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.isAdmin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/';
        return;
    }

    document.getElementById('adminName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('adminEmail').textContent = user.email;
    document.getElementById('adminAvatar').textContent = user.firstName?.[0] || 'A';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
});

// === NAVIGATION ===
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.dataset.section;

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`section-${sectionId}`).classList.add('active');

            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'dishes': 'Manage Dishes',
                'users': 'Manage Users',
                'admins': 'Admin Users'
            };
            document.getElementById('pageTitle').textContent = titles[sectionId];

            // Load section data
            if (sectionId === 'dashboard') loadDashboard();
            else if (sectionId === 'dishes') loadDishes();
            else if (sectionId === 'users') loadUsers();
            else if (sectionId === 'admins') loadAdmins();
        });
    });

    // Quick actions
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function () {
            const action = this.dataset.action;
            if (action === 'add-dish') {
                document.querySelector('[data-section="dishes"]').click();
                setTimeout(() => document.getElementById('addDishBtn').click(), 100);
            } else if (action === 'view-users') {
                document.querySelector('[data-section="users"]').click();
            } else if (action === 'view-admins') {
                document.querySelector('[data-section="admins"]').click();
            }
        });
    });
}

// === DASHBOARD ===
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('statUsers').textContent = data.totalUsers;
            document.getElementById('statAdmins').textContent = data.totalAdmins;
            document.getElementById('statDishes').textContent = data.totalDishes;
            document.getElementById('statAvailable').textContent = data.availableDishes;
        }
    } catch (error) {
        console.error('Load Dashboard Error:', error);
    }
}

// === DISHES MANAGEMENT ===
async function loadDishes() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dishes`);

        if (response.ok) {
            const data = await response.json();
            renderDishes(data.dishes);
        }
    } catch (error) {
        console.error('Load Dishes Error:', error);
    }
}

function renderDishes(dishes) {
    const grid = document.getElementById('dishesGrid');

    if (dishes.length === 0) {
        grid.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">No dishes yet. Add your first dish!</p>';
        return;
    }

    grid.innerHTML = dishes.map(dish => `
        <div class="dish-card">
            <div class="dish-header">
                <div class="dish-emoji">${dish.emoji}</div>
                <span class="dish-badge ${dish.isAvailable ? 'available' : 'unavailable'}">
                    ${dish.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="dish-name">${dish.name}</div>
            <div class="dish-description">${dish.description}</div>
            <div class="dish-footer">
                <div class="dish-price">₹${dish.price}</div>
                <div class="dish-actions">
                    <button class="btn btn-small btn-ghost" onclick="editDish('${dish._id}')">Edit</button>
                    <button class="btn btn-small btn-ghost" onclick="deleteDish('${dish._id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// === DISH MODAL ===
function initModals() {
    const dishModal = document.getElementById('dishModal');
    const closeDishModal = document.getElementById('closeDishModal');
    const cancelDishBtn = document.getElementById('cancelDishBtn');
    const dishForm = document.getElementById('dishForm');
    const addDishBtn = document.getElementById('addDishBtn');

    addDishBtn.addEventListener('click', () => {
        currentDishId = null;
        document.getElementById('modalDishTitle').textContent = 'Add New Dish';
        dishForm.reset();
        dishModal.classList.add('active');
    });

    closeDishModal.addEventListener('click', () => dishModal.classList.remove('active'));
    cancelDishBtn.addEventListener('click', () => dishModal.classList.remove('active'));

    dishForm.addEventListener('submit', saveDish);
}

async function saveDish(e) {
    e.preventDefault();

    const dishData = {
        name: document.getElementById('dishName').value,
        description: document.getElementById('dishDescription').value,
        price: parseFloat(document.getElementById('dishPrice').value),
        category: document.getElementById('dishCategory').value,
        emoji: document.getElementById('dishEmoji').value || '🍜',
        isAvailable: document.getElementById('dishAvailable').value === 'true'
    };

    try {
        const url = currentDishId
            ? `${API_BASE_URL}/api/admin/dishes/${currentDishId}`
            : `${API_BASE_URL}/api/admin/dishes`;

        const response = await fetch(url, {
            method: currentDishId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(dishData)
        });

        if (response.ok) {
            alert(currentDishId ? 'Dish updated!' : 'Dish created!');
            document.getElementById('dishModal').classList.remove('active');
            loadDishes();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to save dish');
        }
    } catch (error) {
        console.error('Save Dish Error:', error);
        alert('Failed to save dish');
    }
}

async function editDish(dishId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dishes`);
        const data = await response.json();
        const dish = data.dishes.find(d => d._id === dishId);

        if (dish) {
            currentDishId = dishId;
            document.getElementById('modalDishTitle').textContent = 'Edit Dish';
            document.getElementById('dishName').value = dish.name;
            document.getElementById('dishDescription').value = dish.description;
            document.getElementById('dishPrice').value = dish.price;
            document.getElementById('dishCategory').value = dish.category;
            document.getElementById('dishEmoji').value = dish.emoji;
            document.getElementById('dishAvailable').value = dish.isAvailable.toString();
            document.getElementById('dishModal').classList.add('active');
        }
    } catch (error) {
        console.error('Edit Dish Error:', error);
    }
}

async function deleteDish(dishId) {
    if (!confirm('Are you sure you want to delete this dish?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dishes/${dishId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('Dish deleted!');
            loadDishes();
        }
    } catch (error) {
        console.error('Delete Dish Error:', error);
        alert('Failed to delete dish');
    }
}

// === USERS MANAGEMENT ===
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderUsers(data.users);
        }
    } catch (error) {
        console.error('Load Users Error:', error);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.mobile || 'N/A'}</td>
            <td>Floor ${user.floor}, Room ${user.room}</td>
            <td>${user.isAdmin ? '👑 Yes' : 'No'}</td>
            <td>
                ${!user.isAdmin ? `
                    <button class="btn btn-small btn-primary" onclick="makeAdmin('${user._id}')">
                        Make Admin
                    </button>
                ` : ''}
                <button class="btn btn-small btn-ghost" onclick="deleteUser('${user._id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function makeAdmin(userId) {
    if (!confirm('Make this user an admin?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/admins/promote/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('User promoted to admin!');
            loadUsers();
            loadAdmins();
            loadDashboard();
        }
    } catch (error) {
        console.error('Make Admin Error:', error);
        alert('Failed to promote user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('User deleted!');
            loadUsers();
            loadDashboard();
        }
    } catch (error) {
        console.error('Delete User Error:', error);
        alert('Failed to delete user');
    }
}

// === ADMINS MANAGEMENT ===
async function loadAdmins() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            renderAdmins(data.admins);
        }
    } catch (error) {
        console.error('Load Admins Error:', error);
    }
}

function renderAdmins(admins) {
    const grid = document.getElementById('adminsGrid');

    grid.innerHTML = admins.map(admin => `
        <div class="admin-card">
            <div class="admin-card-avatar">${admin.firstName?.[0] || 'A'}</div>
            <div class="admin-card-name">${admin.firstName} ${admin.lastName}</div>
            <div class="admin-card-email">${admin.email}</div>
            <div class="admin-card-info">
                <div style="color: rgba(255,255,255,0.6); font-size: 0.875rem; margin-bottom: 0.5rem;">
                    Floor ${admin.floor}, Room ${admin.room}
                </div>
                <div style="color: rgba(255,255,255,0.6); font-size: 0.875rem;">
                    ${admin.mobile || 'No phone'}
                </div>
            </div>
        </div>
    `).join('');
}

// Search functionality
document.getElementById('userSearch')?.addEventListener('input', function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});
