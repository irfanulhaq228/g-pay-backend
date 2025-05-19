const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.FROM_PASSWORD
    }
});

const SendOtpToEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Your Login OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333;">🔐 Your OTP for Login</h2>
                <p>Hello,</p>
                <p>Please use the following One-Time Password (OTP) to complete your login:</p>
                
                <div style="font-size: 24px; letter-spacing: 5px; font-weight: bold; background: #f0f0f0; padding: 10px 20px; border-radius: 5px; width: fit-content; margin: 20px auto; text-align: center; color: #000;">
                    ${otp}
                </div>

                <p>This OTP is valid for one-time use and should not be shared with anyone.</p>
                
                <hr style="margin: 30px 0;" />
                <p style="font-size: 14px; color: #999;">If you did not request this OTP, please ignore this email.</p>
                <p style="font-size: 14px; color: #999;">&copy; ${new Date().getFullYear()} Netrex</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }

};


const sendFeedbackToAdmin = async (email, name, message) => {
    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Feedback from User',
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <!-- Logo Section -->
        <div style="text-align: center; margin-bottom: 20px;">
            <img src=${process.env.DOMAIN}/uploads/logo.png alt="G-Pay" style="height: 60px;" />
        </div>

        <!-- Feedback Heading -->
        <h2 style="color: #222; text-align: center; margin-bottom: 10px;">📩 Feedback from <span style="color: #007BFF;">${name}</span></h2>
        <hr style="border: none; height: 1px; background-color: #ddd; margin: 20px 0;" />

        <!-- Feedback Message -->
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
            ${message}
        </p>

        <!-- Footer Note -->
        <hr style="border: none; height: 1px; background-color: #eee; margin: 30px 0;" />
        <p style="font-size: 13px; color: #999; text-align: center;">
            This feedback is sent to the admin team.
        </p>
        <p style="font-size: 13px; color: #999; text-align: center;">
            &copy; ${new Date().getFullYear()} Netrex. All rights reserved.
        </p>
    </div>
`
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('Feedback sent to admin successfully');
    } catch (error) {
        console.error('Error sending feedback to admin:', error);
    }
}

module.exports = { SendOtpToEmail, sendFeedbackToAdmin }