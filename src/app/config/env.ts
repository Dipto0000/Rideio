import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
    PORT: string;
    DB_URL: string;
    NODE_ENV: "development" | "production";
    BCRYPT_SALT_ROUND: string;
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES: string;
    JWT_VERIFICATION_SECRET: string;
    FRONTEND_URL: string;
    MAILTRAP_HOST: string;
    MAILTRAP_PORT: string;
    MAILTRAP_USER: string;
    MAILTRAP_PASS: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    SSL_STORE_ID: string;
    SSL_STORE_PASSWORD: string;
    SSL_IS_SANDBOX: string;
    SSL_SUCCESS_URL: string;
    SSL_CANCEL_URL: string;
    SSL_FAIL_URL: string;
    SSL_IPN_URL: string;
    SUPER_ADMIN_EMAIL?: string;
    SUPER_ADMIN_PASSWORD?: string;
}

const loadEnvVariables = (): EnvConfig => {
    const requiredEnvVariables: string[] = [
        "PORT", "DB_URL", "NODE_ENV", "BCRYPT_SALT_ROUND",
        "JWT_ACCESS_EXPIRES", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_REFRESH_EXPIRES", "JWT_VERIFICATION_SECRET", "FRONTEND_URL",
        "MAILTRAP_HOST", "MAILTRAP_PORT", "MAILTRAP_USER", "MAILTRAP_PASS",
        "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
        "SSL_STORE_ID", "SSL_STORE_PASSWORD", "SSL_IS_SANDBOX",
        "SSL_SUCCESS_URL", "SSL_CANCEL_URL", "SSL_FAIL_URL",        "SSL_IPN_URL"
    ];

    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable ${key}`);
        }
    });

    return {
        PORT: process.env.PORT as string,
        DB_URL: process.env.DB_URL!,
        NODE_ENV: process.env.NODE_ENV as "development" | "production",
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
        JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
        JWT_VERIFICATION_SECRET: process.env.JWT_VERIFICATION_SECRET as string,
        FRONTEND_URL: process.env.FRONTEND_URL as string,
        MAILTRAP_HOST: process.env.MAILTRAP_HOST as string,
        MAILTRAP_PORT: process.env.MAILTRAP_PORT as string,
        MAILTRAP_USER: process.env.MAILTRAP_USER as string,
        MAILTRAP_PASS: process.env.MAILTRAP_PASS as string,
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
        SSL_STORE_ID: process.env.SSL_STORE_ID!,
        SSL_STORE_PASSWORD: process.env.SSL_STORE_PASSWORD!,
        SSL_IS_SANDBOX: process.env.SSL_IS_SANDBOX!,
        SSL_SUCCESS_URL: process.env.SSL_SUCCESS_URL!,
        SSL_CANCEL_URL: process.env.SSL_CANCEL_URL!,
        SSL_FAIL_URL: process.env.SSL_FAIL_URL!,
        SSL_IPN_URL: process.env.SSL_IPN_URL!,
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
    };
}

export const envVars = loadEnvVariables();