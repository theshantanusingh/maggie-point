/* ===================================
   admin.js - Admin Panel Logic
   =================================== */

const API_BASE_URL = window.location.hostname === 'maggiepoint.onessa.agency' || window.location.hostname === 'www.maggiepoint.onessa.agency'
    ? ''
    : 'http://localhost:3000';

let currentDishId = null;
let authToken = null;
let allOrders = [];

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    initNavigation();
    initModals();
    loadDashboard();

    // Auto refresh orders every 30s
    setInterval(() => {
        if (document.getElementById('section-orders').classList.contains('active')) {
            loadOrders();
        }
    }, 30000);
});

// === AUTHENTICATION ===
function checkAuth() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    authToken = token;
    loadUserProfile();
}

async function loadUserProfile() {
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

document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
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

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`section-${sectionId}`).classList.add('active');

            const titles = {
                'dashboard': 'Dashboard',
                'orders': 'Manage Orders',
                'dishes': 'Manage Dishes',
                'users': 'Manage Users',
                'admins': 'Admin Users'
            };
            document.getElementById('pageTitle').textContent = titles[sectionId];

            if (sectionId === 'dashboard') loadDashboard();
            else if (sectionId === 'orders') loadOrders();
            else if (sectionId === 'dishes') loadDishes();
            else if (sectionId === 'users') loadUsers();
            else if (sectionId === 'admins') loadAdmins();
        });
    });

    // Order Filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterOrders(this.dataset.status);
        });
    });
}

// === ORDERS MANAGEMENT ===
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            allOrders = data.orders;

            // Filter based on active chip
            const activeStatus = document.querySelector('.filter-chip.active')?.dataset.status || 'all';
            filterOrders(activeStatus);

            // Update dash stats
            const pendingCount = allOrders.filter(o => o.status === 'pending' || o.status === 'payment_pending').length;
            document.getElementById('statOrders').textContent = pendingCount;

            // Calc revenue
            const revenue = allOrders
                .filter(o => o.status !== 'cancelled' && o.paymentDetails?.paymentVerified)
                .reduce((sum, o) => sum + o.totalAmount, 0);
            document.getElementById('statRevenue').textContent = `₹${revenue}`;
        }
    } catch (error) {
        console.error('Load Orders Error:', error);
    }
}

function filterOrders(status) {
    if (status === 'all') {
        renderOrders(allOrders);
    } else {
        const filtered = allOrders.filter(o => o.status === status || (status === 'pending' && o.status === 'payment_pending'));
        renderOrders(filtered);
    }
}

function renderOrders(orders) {
    const grid = document.getElementById('ordersGrid');
    if (orders.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.5); width:100%">No orders found</p>';
        return;
    }

    grid.innerHTML = orders.map(order => `
        <div class="order-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1)">
                <div>
                    <span style="color:#f97316; font-weight:700">#${order._id.slice(-6).toUpperCase()}</span>
                    <span style="color:rgba(255,255,255,0.5); font-size: 12px; margin-left: 10px">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <span class="status-badge" style="padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1); font-size: 12px; text-transform: uppercase;">${order.status.replace('_', ' ')}</span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px">
                <div>
                    <div style="color:rgba(255,255,255,0.5); font-size:12px">User Details</div>
                    <div style="font-weight:600">${order.userId?.firstName} ${order.userId?.lastName}</div>
                    <div style="font-size:14px">Room: ${order.userId?.room}, Floor: ${order.userId?.floor}</div>
                    <div style="font-size:14px">Phone: ${order.userId?.mobile}</div>
                </div>
                <div>
                    <div style="color:rgba(255,255,255,0.5); font-size:12px">Payment</div>
                    <div style="font-weight:600; color:#f97316">₹${order.totalAmount}</div>
                    ${order.paymentDetails?.utrNumber ? `<div style="font-size:13px; background:rgba(249,115,22,0.1); padding:4px; border-radius:4px; margin-top:5px">UTR: ${order.paymentDetails.utrNumber}</div>` : '<div style="font-size:13px; color:rgba(255,255,255,0.5)">No UTR</div>'}
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; margin-bottom:15px">
                ${order.items.map(i => `<div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:4px"><span>${i.quantity}x ${i.name}</span><span>₹${i.price * i.quantity}</span></div>`).join('')}
                ${order.deliveryDetails.specialInstructions ? `<div style="font-size:12px; color:#f97316; margin-top:5px">Note: ${order.deliveryDetails.specialInstructions}</div>` : ''}
            </div>

            <div class="order-actions">
                <div style="margin-bottom: 10px; display: flex; gap: 5px; align-items: center;">
                   <span style="font-size: 12px; color: #888">Time (min):</span>
                   <input type="number" value="${order.estimatedDeliveryTime || 10}" style="width: 50px; padding: 4px; border-radius: 4px; border: 1px solid #444; background: #222; color: white" id="time-${order._id}">
                   <button class="btn btn-small btn-outline" style="padding: 4px 8px" onclick="updateTime('${order._id}')">Set</button>
                </div>

                <div style="display:flex; gap:5px; flex-wrap:wrap; justify-content: flex-end;">
                    ${(order.status === 'pending' || order.status === 'payment_pending') ? `
                        <button class="btn btn-primary btn-small" onclick="verifyPayment('${order._id}')">✅ Verify</button>
                    ` : ''}

                    ${(order.status === 'confirmed') ?
            `<button class="btn btn-primary btn-small" onclick="updateOrderStatus('${order._id}', 'preparing')">👨‍🍳 Prepare</button>` : ''}
                    
                    ${(order.status === 'preparing') ?
            `<button class="btn btn-primary btn-small" onclick="updateOrderStatus('${order._id}', 'out_for_delivery')">🛵 Send</button>` : ''}
                    
                    ${(order.status === 'out_for_delivery') ?
            `<button class="btn btn-success btn-small" onclick="updateOrderStatus('${order._id}', 'delivered')">🎉 Done</button>` : ''}

                    ${order.status !== 'cancelled' && order.status !== 'delivered' ?
            `<button class="btn btn-ghost btn-small" style="color:#ef4444" onclick="updateOrderStatus('${order._id}', 'cancelled')">❌ Cancel</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function updateTime(orderId) {
    const minutes = document.getElementById(`time-${orderId}`).value;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/time`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ minutes })
        });
        if (response.ok) {
            alert('Time updated!');
            // Don't reload entire list to keep position, just alert
        }
    } catch (e) { alert('Error updating time'); }
}

async function verifyPayment(orderId) {
    if (!confirm('Confirm payment verification?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/verify-payment`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            alert('Payment verified!');
            loadOrders();
        }
    } catch (e) { alert('Error verifying payment'); }
}

async function updateOrderStatus(orderId, status) {
    if (!confirm(`Change status to ${status}?`)) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            loadOrders();
        }
    } catch (e) { alert('Error updating status'); }
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

// === MODALS ===
function initModals() {
    // Dish Modals
    const dishModal = document.getElementById('dishModal');
    const closeDishModal = document.getElementById('closeDishModal');
    const cancelDishBtn = document.getElementById('cancelDishBtn');
    const dishForm = document.getElementById('dishForm');
    const addDishBtn = document.getElementById('addDishBtn');

    if (addDishBtn) {
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

    // User Modals
    const userModal = document.getElementById('userModal');
    const closeUserModal = document.getElementById('closeUserModal');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    const userForm = document.getElementById('userForm');
    const createUserBtn = document.getElementById('createUserBtn');

    if (createUserBtn) {
        createUserBtn.addEventListener('click', () => {
            userForm.reset();
            userModal.classList.add('active');
        });

        closeUserModal.addEventListener('click', () => userModal.classList.remove('active'));
        cancelUserBtn.addEventListener('click', () => userModal.classList.remove('active'));
        userForm.addEventListener('submit', createUser);
    }

    // Reset Password Modal
    const resetModal = document.getElementById('resetPasswordModal');
    const closeResetModal = document.getElementById('closeResetModal');
    const cancelResetBtn = document.getElementById('cancelResetBtn');
    const resetForm = document.getElementById('resetPasswordForm');

    if (resetModal) {
        closeResetModal.addEventListener('click', () => resetModal.classList.remove('active'));
        cancelResetBtn.addEventListener('click', () => resetModal.classList.remove('active'));
        resetForm.addEventListener('submit', resetPassword);
    }
}

async function saveDish(e) {
    if (e) e.preventDefault();

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

async function createUser(e) {
    if (e) e.preventDefault();

    const userData = {
        firstName: document.getElementById('userFirstName').value,
        lastName: document.getElementById('userLastName').value,
        email: document.getElementById('userEmail').value,
        mobile: document.getElementById('userMobile').value,
        floor: document.getElementById('userFloor').value,
        room: document.getElementById('userRoom').value,
        password: document.getElementById('userPassword').value,
        isAdmin: document.getElementById('userIsAdmin').checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert('User created successfully!');
            document.getElementById('userModal').classList.remove('active');
            loadUsers();
            loadDashboard();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to create user');
        }
    } catch (error) {
        console.error('Create User Error:', error);
        alert('Failed to create user');
    }
}

let targetUserId = null;

function openResetPasswordModal(userId, userName) {
    targetUserId = userId;
    const targetEl = document.getElementById('resetTargetUser');
    if (targetEl) targetEl.textContent = userName;
    document.getElementById('newPassword').value = '';
    document.getElementById('resetPasswordModal').classList.add('active');
}

async function resetPassword(e) {
    if (e) e.preventDefault();
    if (!targetUserId) return;

    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${targetUserId}/reset-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ newPassword })
        });

        if (response.ok) {
            alert('Password reset successfully!');
            document.getElementById('resetPasswordModal').classList.remove('active');
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to reset password');
        }
    } catch (error) {
        console.error('Reset Password Error:', error);
        alert('Failed to reset password');
    }
}

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
            <td>
                <div style="font-weight: 500;">${user.firstName} ${user.lastName}</div>
            </td>
            <td>${user.email}</td>
            <td>${user.mobile || 'N/A'}</td>
            <td>Floor ${user.floor}, Room ${user.room}</td>
            <td>${user.isAdmin ? '<span style="color:#f97316">👑 Yes</span>' : 'No'}</td>
            <td>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-small btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openResetPasswordModal('${user._id}', '${user.firstName.replace(/'/g, "\\'") + ' ' + user.lastName.replace(/'/g, "\\'")}')">
                        Reset Pwd
                    </button>
                    ${!user.isAdmin ? `
                        <button class="btn btn-small btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="makeAdmin('${user._id}')">
                            Promote
                        </button>
                    ` : ''}
                    <button class="btn btn-small btn-ghost" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444;" onclick="deleteUser('${user._id}')">
                        Delete
                    </button>
                </div>
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
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

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
