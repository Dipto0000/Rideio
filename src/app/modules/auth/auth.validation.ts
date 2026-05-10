import { z } from "zod/v4";
import { Role, SubRole } from "../user/user.interface.js";

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

// Rider registration validation (allows social login)
const registerRiderValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    // Role and subRole are set by the endpoint, not from client
});

// Driver registration validation (credentials only, requires vehicle details)
const registerDriverValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    address: z.string().optional(),
    // Driver-specific fields (required)
    vehicleType: z.enum(["bike", "car"], "Vehicle type is required"),
    numberplate: z.string().min(1, "Vehicle license plate is required"),
    licenseNumber: z.string().min(1, "Driver license number is required"),
    dob: z.string().min(1, "Date of birth is required").refine((val) => {
        // Basic date validation - should be a valid past date
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
    }, "Invalid date of birth"),
    // Role and subRole are set by the endpoint, not from client
});

export const authValidation = {
    loginValidation,
    googleAuthValidation,
    verifyEmailValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation,
    setPasswordValidation,
    registerRiderValidation,
    registerDriverValidation,
};

