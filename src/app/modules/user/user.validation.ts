import { z } from "zod/v4";

export const createUserValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).default("USER"),
    subRole: z.enum(["RIDER", "DRIVER"]).default("RIDER"),
    phone: z.string().optional(),
    address: z.string().optional(),
    // Driver-specific fields (optional by default)
    vehicleType: z.enum(["bike", "car"]).optional(),
    numberplate: z.string().optional(),
    licenseNumber: z.string().optional(),
    dob: z.string().optional(), // Will be coerced to Date
}).refine((data) => {
    if (data.subRole === "DRIVER") {
        return data.vehicleType && data.numberplate && data.licenseNumber;
    }
    return true;
}, {
    message: "Vehicle type, numberplate, and license number are required for drivers",
    path: ["vehicleType", "numberplate", "licenseNumber"]
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
