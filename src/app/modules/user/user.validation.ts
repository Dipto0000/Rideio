import { z } from "zod";

export const createUserValidationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).default("USER"),
    subRole: z.enum(["RIDER", "DRIVER"]).default("RIDER"),
});

export const updateUserValidationSchema = createUserValidationSchema.partial();