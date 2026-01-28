const Offer = require('../models/Offer');

async function calculateDiscountedPrice(dish) {
    const activeOffers = await Offer.find({ isActive: true });
    let bestPrice = dish.price;

    activeOffers.forEach(offer => {
        let isApplicable = false;

        if (offer.applicableTo === 'all') {
            isApplicable = true;
        } else if (offer.applicableTo === 'category' && offer.targetId.toLowerCase() === dish.category.toLowerCase()) {
            isApplicable = true;
        } else if (offer.applicableTo === 'dish' && offer.targetId.toString() === dish._id.toString()) {
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
            }
        }
    });

    return Math.round(bestPrice);
}

module.exports = { calculateDiscountedPrice };
