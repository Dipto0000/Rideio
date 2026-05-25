import nodemailer from "nodemailer";
import { envVars } from "../config/env.js";

const transporter = nodemailer.createTransport({
    host: envVars.EMAIL_HOST,
    port: Number(envVars.EMAIL_PORT),
    secure: Number(envVars.EMAIL_PORT) === 465,
    auth: {
        user: envVars.GMAIL_USER,
        pass: envVars.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 10000, // 10s to establish connection
    socketTimeout: 15000,     // 15s for mail transaction
});

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
}

const style = {
    body: "font-family: 'Inter', Arial, sans-serif; background: #f7f9fb; margin: 0; padding: 0;",
    container: "max-width: 520px; margin: 0 auto; padding: 32px 24px;",
    card: "background: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);",
    logo: "font-size: 24px; font-weight: 800; color: #070235; text-align: center; margin-bottom: 24px; letter-spacing: -0.5px;",
    heading: "font-size: 22px; font-weight: 700; color: #070235; text-align: center; margin: 0 0 8px 0;",
    text: "font-size: 15px; color: #47464f; line-height: 1.6; text-align: center; margin: 0 0 24px 0;",
    btn: "display: inline-block; background: #006b5f; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center;",
    btnWrapper: "text-align: center; margin: 24px 0;",
    footer: "font-size: 12px; color: #c8c5d0; text-align: center; margin-top: 24px;",
    divider: "border: none; border-top: 1px solid #e6e8ea; margin: 24px 0;",
};

const sendEmail = async (options: SendEmailOptions) => {
    const { to, subject, templateName, templateData } = options;

    let html = "";
    switch (templateName) {
        case "confirmEmail":
            html = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="${style.body}">
                    <div style="${style.container}">
                        <div style="${style.card}">
                            <div style="${style.logo}">Rideio</div>
                            <h1 style="${style.heading}">Verify Your Email</h1>
                            <p style="${style.text}">Hello ${templateData.name},</p>
                            <p style="${style.text}">Thanks for joining Rideio! Click the button below to verify your email address and activate your account.</p>
                            <div style="${style.btnWrapper}">
                                <a href="${templateData.verifyLink}" style="${style.btn}">Verify Email</a>
                            </div>
                            <p style="${style.text}">This link expires in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
                            <hr style="${style.divider}" />
                            <p style="${style.footer}">&copy; 2026 Rideio. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            break;
        case "forgetPassword":
            html = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="${style.body}">
                    <div style="${style.container}">
                        <div style="${style.card}">
                            <div style="${style.logo}">Rideio</div>
                            <h1 style="${style.heading}">Reset Your Password</h1>
                            <p style="${style.text}">Hello ${templateData.name},</p>
                            <p style="${style.text}">We received a request to reset your password. Click the button below to set a new one.</p>
                            <div style="${style.btnWrapper}">
                                <a href="${templateData.resetUILink}" style="${style.btn}">Reset Password</a>
                            </div>
                            <p style="${style.text}">This link expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                            <hr style="${style.divider}" />
                            <p style="${style.footer}">&copy; 2026 Rideio. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
            break;
        default:
            html = `<p>${templateData.message || "No content"}</p>`;
    }

    await transporter.sendMail({
        from: `"${envVars.EMAIL_FROM_NAME}" <${envVars.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

export { sendEmail };
