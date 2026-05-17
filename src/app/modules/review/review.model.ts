import { model, Schema } from "mongoose";
import { IReview } from "./review.interface.js";

const reviewSchema = new Schema<IReview>(
    {
        rideId: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
        riderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        driverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 1000 },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

// Prevent duplicate reviews per ride (race condition protection)
reviewSchema.index({ rideId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
// Index for fetching driver reviews
reviewSchema.index({ driverId: 1, isDeleted: 1 });

export const Review = model<IReview>("Review", reviewSchema);
