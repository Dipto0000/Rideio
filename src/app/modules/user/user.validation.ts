import { z } from "zod/v4";

export const createUserValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    // role and subRole are NOT accepted from the client — hardcoded in the service
    phone: z.string().optional(),
    address: z.string().optional(),
    vehicleType: z.enum(["bike", "car"]).optional(),
    numberplate: z.string().optional(),
    licenseNumber: z.string().optional(),
    dob: z.string().optional(),
});

export const updateUserValidation = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    picture: z.string().url().optional(),
    vehicleType: z.enum(["bike", "car"]).optional(),
    numberplate: z.string().optional(),
    licenseNumber: z.string().optional(),
});
