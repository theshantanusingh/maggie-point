/* ===================================
   EXTREMELY SIMPLE CART MANAGER
   =================================== */

const Cart = {
    // Keys
    KEY: 'maggie_cart',

    // Get cart data
    get() {
        return JSON.parse(localStorage.getItem(this.KEY)) || [];
    },

    // Save cart data
    save(cart) {
        localStorage.setItem(this.KEY, JSON.stringify(cart));
        this.updateBadge();
    },

    // Add item
    add(dish) {
        const cart = this.get();
        const existing = cart.find(item => item._id === dish._id);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                _id: dish._id,
                name: dish.name,
                price: dish.price,
                emoji: dish.emoji,
                quantity: 1
            });
        }

        this.save(cart);
        this.showToast(`Added ${dish.name} to cart!`);
    },

    // Remove item
    remove(id) {
        let cart = this.get();
        cart = cart.filter(item => item._id !== id);
        this.save(cart);
    },

    // Update quantity
    updateQuantity(id, change) {
        const cart = this.get();
        const item = cart.find(i => i._id === id);

        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.remove(id);
                return;
            }
            this.save(cart);
        }
    },

    // Clear cart
    clear() {
        localStorage.removeItem(this.KEY);
        this.updateBadge();
    },

    // Calculate total
    total() {
        return this.get().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    // Update Floating Badge
    updateBadge() {
        const count = this.get().reduce((sum, item) => sum + item.quantity, 0);
        const badges = document.querySelectorAll('.cart-count');
        badges.forEach(b => {
            b.textContent = count;
            b.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    // Simple Toast Notification
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Styles
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#f97316',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            animation: 'fadeIn 0.3s ease'
        });

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateBadge();
});
