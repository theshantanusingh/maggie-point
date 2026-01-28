const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://maggiepoint.onessa.agency';

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email Transporter Error:', error);
    } else {
        console.log('🚀 Email Transporter Ready');
    }
});

// Pretty email templates
const getOTPEmailTemplate = (otp, firstName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .otp-box { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px dashed #f97316; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #f97316; letter-spacing: 8px; margin: 10px 0; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <h1>Maggie Point</h1>
            </div>
            <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Hey ${firstName}! 👋</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Welcome to Maggie Point! We're excited to have you join our late-night food community at Amity University.
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    To verify your email address, please use the OTP code below:
                </p>
                <div class="otp-box">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
                    <div class="otp-code">${otp}</div>
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">Valid for 5 minutes</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">🌙 Open 10:30 PM - 2:00 AM</p>
                <p style="margin: 5px 0;">⚡ 15 min delivery to your room</p>
                <p style="margin: 15px 0 5px;">© 2026 Maggie Point. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getWelcomeEmailTemplate = (firstName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; }
            .logo { font-size: 64px; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .feature-box { background: #f9fafb; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎉</div>
                <h1>Welcome to Maggie Point!</h1>
            </div>
            <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Hey ${firstName}! 🍜</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Your account has been successfully created! You're now part of the Maggie Point family at Amity University, Greater Noida.
                </p>
                <div class="feature-box">
                    <h3 style="color: #f97316; margin-top: 0;">What's Next?</h3>
                    <p style="color: #4b5563; margin: 10px 0;">✅ Browse our delicious menu</p>
                    <p style="color: #4b5563; margin: 10px 0;">✅ Place your first order</p>
                    <p style="color: #4b5563; margin: 10px 0;">✅ Get it delivered to your room in 15 minutes!</p>
                </div>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    We're open every night from <strong>10:30 PM to 2:00 AM</strong> to satisfy your late-night cravings.
                </p>
                <div style="text-align: center;">
                    <a href="${FRONTEND_URL}" class="button">Start Ordering Now</a>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">🌙 Open 10:30 PM - 2:00 AM</p>
                <p style="margin: 5px 0;">⚡ 15 min delivery | 💰 Student-friendly prices</p>
                <p style="margin: 15px 0 5px;">© 2026 Maggie Point. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getLoginEmailTemplate = (firstName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; }
            .logo { font-size: 64px; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🍜</div>
                <h1>Welcome Back!</h1>
            </div>
            <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Hey ${firstName}! 👋</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    You just logged in to your Maggie Point account. We're happy to see you back!
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Ready for some late-night Maggie? We're here to serve you from <strong>10:30 PM to 2:00 AM</strong>.
                </p>
                <div style="background: #fff7ed; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                    <p style="font-size: 18px; color: #f97316; font-weight: bold; margin: 0;">🔥 Craving something delicious?</p>
                    <p style="color: #6b7280; margin: 10px 0 0;">Order now and get it delivered in 15 minutes!</p>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">🌙 Open 10:30 PM - 2:00 AM</p>
                <p style="margin: 5px 0;">⚡ 15 min delivery | 💰 Student-friendly prices</p>
                <p style="margin: 15px 0 5px;">© 2026 Maggie Point. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getOrderStatusEmailTemplate = (user, order, status) => {
    let title = '';
    let color = '#f97316';
    let icon = '🛒';
    let message = '';

    switch (status) {
        case 'PAID':
            title = 'Payment Verified!';
            color = '#10b981';
            icon = '✅';
            message = `We've received your payment and our chefs are now preparing your order.`;
            break;
        case 'OUT_FOR_DELIVERY':
            if (order.deliveryType === 'takeaway') {
                title = 'Ready for Pickup!';
                color = '#f97316';
                icon = '🥡';
                message = `Your order is ready at the counter! Please come and collect it while it's hot. 🔥`;
            } else {
                title = 'Out for Delivery!';
                color = '#f97316';
                icon = '🛵';
                message = `Your order is on its way to your room. Get ready for something delicious!`;
            }
            break;
        case 'DELIVERED':
            title = (order.deliveryType === 'takeaway') ? 'Order Collected!' : 'Order Delivered!';
            color = '#3b82f6';
            icon = '😋';
            message = `Enjoy your meal! We hope it satisfies your cravings.`;
            if (order.deliveryType === 'takeaway') message = `Thanks for stopping by! Enjoy your delicious meal.`;
            break;
        case 'CANCELLED':
            title = 'Order Cancelled';
            color = '#ef4444';
            icon = '❌';
            message = `Your order has been cancelled. If you already paid, we'll process your refund shortly.`;
            break;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: ${color}; padding: 40px 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; }
            .icon { font-size: 48px; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .order-details { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">${icon}</div>
                <h1>${title}</h1>
            </div>
            <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.firstName}! 👋</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
                <div class="order-details">
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order.orderId}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                    <p style="margin: 5px 0;"><strong>Delivery to:</strong> Room ${user.room}, Floor ${user.floor}</p>
                    ${status === 'PAID' ? `<p style="margin: 15px 0 5px; text-align: center;"><a href="${FRONTEND_URL}/invoice.html?id=${order.mongoId}" style="background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">View Invoice 📄</a></p>` : ''}
                </div>
                <p style="color: #6b7280; font-size: 14px;">If you have any questions, feel free to contact us.</p>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">🌙 Maggie Point - Late Night Delivery</p>
                <p style="margin: 15px 0 5px;">© 2026 Maggie Point. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getOfferEmailTemplate = (firstName, offer) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); padding: 40px 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 32px; }
            .content { padding: 40px 30px; text-align: center; }
            .offer-card { background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; padding: 30px; margin: 25px 0; }
            .offer-title { font-size: 24px; font-weight: bold; color: #e11d48; margin-bottom: 10px; }
            .offer-desc { color: #4b5563; font-size: 16px; margin-bottom: 20px; }
            .button { display: inline-block; background: #f43f5e; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size: 48px; margin-bottom: 10px;">🔥</div>
                <h1>Special Offer Found!</h1>
            </div>
            <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Hey ${firstName}!</h2>
                <p style="color: #4b5563; font-size: 16px;">We have a special treat just for you. Check out our latest offer!</p>
                <div class="offer-card">
                    <div class="offer-title">${offer.title}</div>
                    <p class="offer-desc">${offer.description}</p>
                    <a href="${FRONTEND_URL}/menu.html" class="button">Grab this Offer</a>
                </div>
                <p style="color: #9ca3af; font-size: 12px;">Valid until: ${new Date(offer.validUntil).toLocaleDateString()}</p>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">🌙 Maggie Point - Amity University</p>
                <p style="margin: 15px 0 5px;">© 2026 Maggie Point. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getBulkEmailTemplate = (firstName, content) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: #1f2937; padding: 30px; text-align: center; color: white; }
            .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Maggie Point Update</h1>
            </div>
            <div class="content">
                <p>Hello ${firstName},</p>
                ${content}
            </div>
            <div class="footer">
                <p>You received this email from Maggie Point. <br> Amity University, Greater Noida.</p>
                <p>© 2026 Maggie Point</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const logger = require('../utils/logger');

// Send OTP Email
const sendOTPEmail = async (email, otp, firstName) => {
    try {
        const mailOptions = {
            from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your OTP Code - ${otp}`,
            html: getOTPEmailTemplate(otp, firstName)
        };

        await transporter.sendMail(mailOptions);
        logger.info(`OTP Email sent successfully to ${email}`);
    } catch (error) {
        logger.error(`Error sending OTP Email to ${email}: ${error.message}`);
        throw error;
    }
};

// Send Welcome Email
const sendWelcomeEmail = async (email, firstName) => {
    try {
        const mailOptions = {
            from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🎉 Welcome to Maggie Point!',
            html: getWelcomeEmailTemplate(firstName)
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Welcome Email sent successfully to ${email}`);
    } catch (error) {
        logger.error(`Error sending Welcome Email to ${email}: ${error.message}`);
        throw error;
    }
};

// Send Login Email
const sendLoginEmail = async (email, firstName) => {
    try {
        const mailOptions = {
            from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '👋 Welcome Back to Maggie Point!',
            html: getLoginEmailTemplate(firstName)
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Login Email sent successfully to ${email}`);
    } catch (error) {
        logger.error(`Error sending Login Email to ${email}: ${error.message}`);
        throw error;
    }
};

// Send Order Status Email
const sendOrderStatusEmail = async (user, order, status) => {
    try {
        const mailOptions = {
            from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Order Update - #${order.orderId}`,
            html: getOrderStatusEmailTemplate(user, order, status)
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Order Status Email (${status}) sent to ${user.email}`);
    } catch (error) {
        logger.error(`Error sending Order Status Email to ${user.email}: ${error.message}`);
    }
};

// Send Offer Email
const sendOfferEmail = async (user, offer) => {
    try {
        const mailOptions = {
            from: `"Maggie Point 🔥" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `🔥 Special Offer: ${offer.title}`,
            html: getOfferEmailTemplate(user.firstName, offer)
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Offer Email sent to ${user.email}`);
    } catch (error) {
        logger.error(`Error sending Offer Email to ${user.email}: ${error.message}`);
    }
};

// Send Custom/Bulk Email
const sendBulkEmail = async (user, subject, content) => {
    try {
        const mailOptions = {
            from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: subject,
            html: getBulkEmailTemplate(user.firstName, content)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        logger.error(`Error sending Bulk Email to ${user.email}: ${error.message}`);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendLoginEmail,
    sendOrderStatusEmail,
    sendOfferEmail,
    sendBulkEmail
};
