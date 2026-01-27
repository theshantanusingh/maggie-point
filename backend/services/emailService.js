const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
                    <a href="http://maggiepoint.onessa.agency" class="button">Start Ordering Now</a>
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

// Send OTP Email
const sendOTPEmail = async (email, otp, firstName) => {
    const mailOptions = {
        from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your OTP Code - ${otp}`,
        html: getOTPEmailTemplate(otp, firstName)
    };

    await transporter.sendMail(mailOptions);
};

// Send Welcome Email
const sendWelcomeEmail = async (email, firstName) => {
    const mailOptions = {
        from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to Maggie Point!',
        html: getWelcomeEmailTemplate(firstName)
    };

    await transporter.sendMail(mailOptions);
};

// Send Login Email
const sendLoginEmail = async (email, firstName) => {
    const mailOptions = {
        from: `"Maggie Point 🍜" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '👋 Welcome Back to Maggie Point!',
        html: getLoginEmailTemplate(firstName)
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendLoginEmail
};
