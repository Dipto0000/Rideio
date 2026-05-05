import { z } from "zod/v4";

export const createReviewValidation = z.object({
    rideId: z.string().min(1, "Ride ID is required"),
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    comment: z.string().max(500, "Comment must be under 500 characters").optional(),
});
