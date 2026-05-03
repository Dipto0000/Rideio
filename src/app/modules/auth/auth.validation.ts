import { z } from "zod/v4";

const loginValidation = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const googleAuthValidation = z.object({
    email: z.email("Invalid email address"),
    name: z.string().min(1, "Name is required"),
    googleId: z.string().min(1, "Google ID is required"),
    picture: z.string().url().optional(),
});

const verifyEmailValidation = z.object({
    token: z.string().min(1, "Token is required"),
});

const forgotPasswordValidation = z.object({
    email: z.email("Invalid email address"),
});

const resetPasswordValidation = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    token: z.string().min(1, "Token is required"),
});

const changePasswordValidation = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const setPasswordValidation = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authValidation = {
    loginValidation,
    googleAuthValidation,
    verifyEmailValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation,
    setPasswordValidation,
};

