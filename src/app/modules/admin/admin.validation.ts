import { z } from "zod/v4";

export const createAdminValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
});

export const updateSubscriptionStatusValidation = z.object({
    status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"]),
});

export const softDeleteValidation = z.object({
    reason: z.string().max(500, "Reason must be under 500 characters").optional(),
});
