/* ===================================
   offers.js - Shared Discount Logic
   =================================== */

const Offers = {
    activeOffers: [],

    async fetchActive() {
        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '';
            const response = await fetch(`${API_URL}/api/offers/active`);
            const data = await response.json();
            this.activeOffers = data.offers || [];
            return this.activeOffers;
        } catch (error) {
            console.error('Failed to fetch offers:', error);
            return [];
        }
    },

    calculateDiscount(dish) {
        if (!this.activeOffers.length) return { hasDiscount: false, finalPrice: dish.price };

        let bestPrice = dish.price;
        let appliedOffer = null;

        this.activeOffers.forEach(offer => {
            let isApplicable = false;

            if (offer.applicableTo === 'all') {
                isApplicable = true;
            } else if (offer.applicableTo === 'category' && offer.targetId.toLowerCase() === dish.category.toLowerCase()) {
                isApplicable = true;
            } else if (offer.applicableTo === 'dish' && offer.targetId === dish._id) {
                isApplicable = true;
            }

            if (isApplicable) {
                let currentDiscounted = dish.price;
                if (offer.discountType === 'percentage') {
                    currentDiscounted = dish.price * (1 - offer.discountValue / 100);
                } else if (offer.discountType === 'flat') {
                    currentDiscounted = Math.max(0, dish.price - offer.discountValue);
                }

                if (currentDiscounted < bestPrice) {
                    bestPrice = currentDiscounted;
                    appliedOffer = offer;
                }
            }
        });

        return {
            hasDiscount: bestPrice < dish.price,
            originalPrice: dish.price,
            finalPrice: Math.round(bestPrice),
            offerTitle: appliedOffer ? appliedOffer.title : null
        };
    }
};
