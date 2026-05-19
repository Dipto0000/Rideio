import { z } from "zod/v4";

const bdPhoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{6,}$/;

const phoneOptional = z.string().regex(bdPhoneRegex, "Enter a valid Bangladeshi phone number").optional().or(z.literal(""));
const password = z.string().min(6, "Password must be at least 6 characters").regex(passwordRegex, "Password must contain at least one letter and one special character");

export const createUserValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password,
    // role and subRole are NOT accepted from the client — hardcoded in the service
    phone: phoneOptional,
    address: z.string().optional(),
    vehicleType: z.enum(["bike", "car"]).optional(),
    numberplate: z.string().optional(),
    licenseNumber: z.string().optional(),
    dob: z.string().optional(),
});

export const updateUserValidation = z.object({
    name: z.string().min(1).optional(),
    phone: phoneOptional,
    address: z.string().optional(),
    picture: z.string().url().optional(),
    vehicleType: z.enum(["bike", "car"]).optional(),
    numberplate: z.string().optional(),
    licenseNumber: z.string().optional(),
});
