/* ===================================
   admin.js - Admin Panel Logic
   =================================== */

const getApiUrl = () => {
    const host = window.location.hostname;
    // If we're on localhost or local IP, use port 3000
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
        return `http://${host}:3000`;
    }
    // For VPS/Production, use relative paths to work with Nginx/Proxy
    return '';
};
const API_BASE_URL = getApiUrl();

let currentDishId = null;
let authToken = null;
let allOrders = [];

// Sound Notification
const alertSound = new Audio('/assets/audio/tick.mp3');
let lastOrderId = null;

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    initNavigation();
    initModals();
    loadDashboard();

    // Add Sound Enable Button
    setTimeout(() => {
        const header = document.querySelector('h1#pageTitle');
        if (header) {
            // Remove existing if any
            const existing = header.querySelector('button');
            if (existing) existing.remove();

            const btn = document.createElement('button');
            btn.innerHTML = '🔊 Enable Sound';
            btn.className = 'btn btn-outline btn-small';
            btn.style.marginLeft = '15px';
            btn.style.fontSize = '12px';
            btn.onclick = () => {
                alertSound.volume = 1.0;
                alertSound.play().then(() => {
                    alertSound.pause(); // Just play a bit or pause immediately
                    alertSound.currentTime = 0;
                    btn.innerHTML = '✅ Sound Active';
                    btn.disabled = true;
                    btn.classList.add('btn-primary');
                    btn.classList.remove('btn-outline');
                }).catch(e => {
                    console.error('Audio check failed:', e);
                    alert('Audio Error: ' + e.message + '. Check console.');
                });
            };
            header.appendChild(btn);
        }
    }, 1000);

    // Auto refresh orders every 5s
    setInterval(() => {
        if (document.getElementById('section-orders').classList.contains('active')) {
            loadOrders();
        }
    }, 5000);

    // Timer Interval
    setInterval(() => {
        document.querySelectorAll('.admin-timer').forEach(el => {
            const endTime = parseInt(el.dataset.end);
            if (!endTime) return;
            const diff = endTime - Date.now();
            if (diff > 0) {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            } else {
                el.textContent = "00:00";
                el.style.color = '#ef4444';
            }
        });
    }, 1000);
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

document.getElementById('logoutBtn').addEventListener('click', async function () {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
        try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Logout log failed', e);
        }
    }
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
                'admins': 'Admin Users',
                'activities': 'Activity Feed',
                'inventory': 'Inventory Tracking',
                'finance': 'Financial Records',
                'logs': 'System Logs'
            };
            document.getElementById('pageTitle').textContent = titles[sectionId];

            if (sectionId === 'dashboard') loadDashboard();
            else if (sectionId === 'orders') loadOrders();
            else if (sectionId === 'dishes') loadDishes();
            else if (sectionId === 'users') loadUsers();
            else if (sectionId === 'admins') loadAdmins();
            else if (sectionId === 'activities') loadActivities();
            else if (sectionId === 'inventory') loadInventory();
            else if (sectionId === 'finance') loadFinance();
            else if (sectionId === 'logs') loadLogs();
        });
    });

    // Refresh Activities Btn
    document.getElementById('refreshActivitiesBtn')?.addEventListener('click', loadActivities);

    // Refresh Logs Btn
    document.getElementById('refreshLogsBtn')?.addEventListener('click', loadLogs);

    // Order Filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterOrders(this.dataset.status);
        });
    });
}

// === ACTIVITIES ===
async function loadActivities() {
    const box = document.getElementById('activityBox');
    if (!box) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/activities`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch activity feed');

        const { activities } = await response.json();

        if (activities.length === 0) {
            box.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No activities recorded yet.</p>';
            return;
        }

        box.innerHTML = activities.map(act => {
            const date = new Date(act.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

            const actionColors = {
                'LOGIN': '#10b981',
                'LOGOUT': '#6b7280',
                'SIGNUP': '#3b82f6',
                'ORDER_PLACED': '#f59e0b',
                'ORDER_STATUS_UPDATED': '#8b5cf6',
                'ORDER_CANCELLED': '#ef4444',
                'PAYMENT_SUBMITTED': '#10b981',
                'PAYMENT_VERIFIED': '#10b981',
                'DISH_CREATED': '#3b82f6',
                'DISH_UPDATED': '#3b82f6',
                'DISH_DELETED': '#ef4444'
            };

            const color = actionColors[act.action] || '#888';

            return `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; display: flex; align-items: flex-start; gap: 15px; margin-bottom: 12px">
                <div style="background: ${color}; width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 10px ${color}"></div>
                <div style="flex-grow: 1">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-weight: 700; color: ${color}; font-size: 11px; letter-spacing: 0.5px">${act.action}</span>
                        <span style="font-size: 10px; color: #666">${dateStr}, ${timeStr}</span>
                    </div>
                    <p style="font-size: 14px; margin: 0; color: #e5e7eb; line-height: 1.4">${act.details}</p>
                    ${act.user ? `<div style="font-size: 11px; color: #666; margin-top: 6px; font-family: monospace;">BY: ${act.user.firstName} ${act.user.lastName} (${act.user.email})</div>` : `<div style="font-size: 11px; color: #666; margin-top: 6px; font-family: monospace;">BY: System</div>`}
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        box.innerHTML = `<p style="color: #ef4444; padding: 20px; text-align: center;">Error: ${error.message}</p>`;
    }
}

// === SYSTEM LOGS (RAW) ===
async function loadLogs() {
    const logsBox = document.getElementById('logsBox');
    if (!logsBox) return;

    logsBox.innerHTML = 'Fetching raw terminal output...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/logs/app`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Server responded with ${response.status}: ${errData.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const text = data.logs || '';

        if (!text) {
            logsBox.innerHTML = '<div style="color: #888">No raw logs recorded in file yet.</div>';
            return;
        }

        const lines = text.split('\n').filter(Boolean).reverse(); // Latest logs first

        logsBox.innerHTML = lines.map(line => {
            let color = '#0f0'; // Default green
            if (line.includes('[ERROR]')) color = '#ff4444';
            if (line.includes('[WARN]')) color = '#ffbb33';

            return `<div style="color: ${color}; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 4px 0;">${line}</div>`;
        }).join('');
    } catch (error) {
        console.error('Log fetch error:', error);
        logsBox.innerHTML = `<span style="color: #ff4444">Error: ${error.message}</span>`;
    }
}

// === ORDERS MANAGEMENT ===
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();

            if (data.orders.length > 0) {
                const latestId = data.orders[0]._id;
                if (lastOrderId && latestId !== lastOrderId) {
                    alertSound.play().catch(e => console.log('Audio error:', e));
                }
                lastOrderId = latestId;
            } else {
                lastOrderId = "none";
            }

            allOrders = data.orders;

            const activeStatus = document.querySelector('.filter-chip.active')?.dataset.status || 'all';
            filterOrders(activeStatus);

            const pendingCount = allOrders.filter(o => o.status === 'pending' || o.status === 'payment_pending').length;
            document.getElementById('statOrders').textContent = pendingCount;

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

    grid.innerHTML = orders.map(order => {
        // Calculate timer end time if active
        let timerHtml = '';
        if (['confirmed', 'preparing', 'out_for_delivery'].includes(order.status)) {
            const startTime = new Date(order.preparingAt || order.confirmedAt || Date.now()).getTime();
            const estMins = order.estimatedDeliveryTime || 10;
            const endTime = startTime + (estMins * 60000);
            timerHtml = `<div class="admin-timer" data-end="${endTime}" style="font-size: 24px; font-weight: 800; color: #f97316; margin: 10px 0; font-family: monospace;">--:--</div>`;
        }

        const itemsTotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        return `
        <div class="order-card" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1)">
                <div>
                    <span style="color:#f97316; font-weight:700">#${order._id.slice(-6).toUpperCase()}</span>
                    <span style="color:rgba(255,255,255,0.5); font-size: 12px; margin-left: 10px">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div style="display:flex; gap:10px; align-items:center">
                     <a href="/invoice.html?id=${order._id}" target="_blank" style="text-decoration:none; font-size:12px; background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; color:white;">📄 Invoice</a>
                     <span class="status-badge" style="padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1); font-size: 12px; text-transform: uppercase;">${order.status.replace('_', ' ')}</span>
                </div>
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
                    <div style="font-size: 11px; color: rgba(255,255,255,0.4)">
                        Items: ₹${itemsTotal} + Fee: ₹${order.convenienceFee || 0}
                    </div>
                    ${order.paymentDetails?.utrNumber ? `<div style="font-size:13px; background:rgba(249,115,22,0.1); padding:4px; border-radius:4px; margin-top:5px">UTR: ${order.paymentDetails.utrNumber}</div>` : '<div style="font-size:13px; color:rgba(255,255,255,0.5)">No UTR</div>'}
                    ${order.deliveryType === 'takeaway' ? '<div style="margin-top:5px; background: #3b82f6; color:white; padding: 2px 6px; border-radius: 4px; display:inline-block; font-size: 12px;">Takeaway</div>' : '<div style="margin-top:5px; background: #8b5cf6; color:white; padding: 2px 6px; border-radius: 4px; display:inline-block; font-size: 12px;">Room Delivery</div>'}
                </div>
            </div>

            ${timerHtml}

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
        `;
    }).join('');
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
        }
    } catch (e) { alert('Error updating time'); }
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

// === INVENTORY ===
let inventoryData = [];

async function loadInventory() {
    const list = document.getElementById('inventoryList');
    if (!list) return;
    list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading inventory...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        inventoryData = data.inventory;
        renderInventory();
    } catch (error) {
        list.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Error: ${error.message}</p>`;
    }
}

function renderInventory() {
    const list = document.getElementById('inventoryList');
    if (inventoryData.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No items found. Click + Add Item to start.</p>';
        return;
    }

    list.innerHTML = inventoryData.map(item => {
        const isLow = item.quantity <= item.minThreshold;
        return `
        <div style="background: rgba(255,255,255,0.05); border: 1px solid ${isLow ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}; padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
            ${isLow ? '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: #ef4444;"></div>' : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-size: 11px; color: #666; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">${item.category}</span>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editInventoryItem('${item._id}')" style="background: none; border: none; color: #666; cursor: pointer; padding: 4px;">✏️</button>
                    <button onclick="deleteInventoryItem('${item._id}')" style="background: none; border: none; color: #666; cursor: pointer; padding: 4px;">🗑️</button>
                </div>
            </div>
            <h3 style="font-size: 18px; margin-bottom: 5px; color: white;">${item.name}</h3>
            <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 28px; font-weight: 700; color: ${isLow ? '#ef4444' : '#f97316'}">${item.quantity}</span>
                <span style="color: #666; font-size: 14px;">${item.unit}</span>
            </div>
            ${isLow ? `<p style="font-size: 11px; color: #ef4444; margin-top: 10px; font-weight: 600;">⚠️ LOW STOCK (Min: ${item.minThreshold})</p>` : ''}
            <div style="margin-top: 15px; grid-template-columns: 1fr 1fr; display: grid; gap: 10px;">
                <button class="btn btn-outline btn-small" onclick="updateStock('${item._id}', 1)">+ Add</button>
                <button class="btn btn-outline btn-small" onclick="updateStock('${item._id}', -1)">- Remove</button>
            </div>
        </div>
        `;
    }).join('');
}

function openInventoryModal() {
    document.getElementById('inventoryForm').reset();
    document.getElementById('inventoryModalTitle').textContent = 'Add Inventory Item';
    document.getElementById('inventoryModal').classList.add('active');
}

function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.remove('active');
}

async function updateStock(id, change) {
    const item = inventoryData.find(i => i._id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + change);
    try {
        await fetch(`${API_BASE_URL}/api/admin/inventory/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ quantity: newQty, name: item.name })
        });
        loadInventory();
    } catch (e) {
        alert('Stock update failed');
    }
}

document.getElementById('inventoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('invName').value,
        quantity: parseFloat(document.getElementById('invQuantity').value),
        unit: document.getElementById('invUnit').value,
        category: document.getElementById('invCategory').value,
        minThreshold: parseFloat(document.getElementById('invThreshold').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            closeInventoryModal();
            loadInventory();
        }
    } catch (e) {
        alert('Failed to save item');
    }
});

// === FINANCE ===
async function loadFinance(search = '') {
    const table = document.getElementById('paymentTable');
    if (!table) return;
    table.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Fetching records...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/finance/payments?search=${search}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        document.getElementById('totalRevenue').textContent = `₹${data.totalRevenue}`;

        if (data.payments.length === 0) {
            table.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">No payment entries found.</td></tr>';
            return;
        }

        table.innerHTML = data.payments.map(p => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 15px; font-size: 13px; color: #666;">${new Date(p.createdAt).toLocaleDateString()}</td>
                <td style="padding: 15px;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; color: white;">${p.userId?.firstName} ${p.userId?.lastName}</span>
                        <span style="font-size: 11px; color: #666;">${p.userId?.email}</span>
                    </div>
                </td>
                <td style="padding: 15px; font-family: monospace; color: #f97316;">${p.paymentDetails.utrNumber}</td>
                <td style="padding: 15px; font-weight: 700; color: white;">₹${p.totalAmount}</td>
                <td style="padding: 15px;">
                    <span style="background: ${p.paymentDetails.paymentVerified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${p.paymentDetails.paymentVerified ? '#22c55e' : '#ef4444'}; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                        ${p.paymentDetails.paymentVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        table.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
    }
}

document.getElementById('financeSearch')?.addEventListener('input', (e) => {
    loadFinance(e.target.value);
});

async function deleteInventoryItem(id) {
    if (!confirm('Are you sure you want to remove this item from inventory?')) return;
    try {
        await fetch(`${API_BASE_URL}/api/admin/inventory/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadInventory();
    } catch (e) {
        alert('Deletion failed');
    }
}
