import nodemailer from "nodemailer";
import { envVars } from "../config/env.js";

const transporter = nodemailer.createTransport({
    host: envVars.MAILTRAP_HOST,
    port: Number(envVars.MAILTRAP_PORT),
    auth: {
        user: envVars.MAILTRAP_USER,
        pass: envVars.MAILTRAP_PASS,
    },
});

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
}

const sendEmail = async (options: SendEmailOptions) => {
    const { to, subject, templateName, templateData } = options;

    let html = "";
    switch (templateName) {
        case "confirmEmail":
            html = `
                <h1>Email Confirmation</h1>
                <p>Hello ${templateData.name},</p>
                <p>Please confirm your email by clicking the link below:</p>
                <a href="${templateData.confirmLink}">Confirm Email</a>
                <p>This link expires in 10 minutes.</p>
            `;
            break;
        case "forgetPassword":
            html = `
                <h1>Password Reset</h1>
                <p>Hello ${templateData.name},</p>
                <p>Reset your password by clicking the link below:</p>
                <a href="${templateData.resetUILink}">Reset Password</a>
                <p>This link expires in 10 minutes.</p>
            `;
            break;
        default:
            html = `<p>${templateData.message || "No content"}</p>`;
    }

    await transporter.sendMail({
        from: `"Rideio" <no-reply@rideio.com>`,
        to,
        subject,
        html,
    });
};

export { sendEmail };
