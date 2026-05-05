import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { Ride } from "../ride/ride.model.js";
import { RideStatus } from "../ride/ride.interface.js";
import { User } from "../user/user.model.js";
import { Review } from "./review.model.js";

const createReview = async (payload: { rideId: string; rating: number; comment?: string }, riderId: string) => {
    const ride = await Ride.findById(payload.rideId);

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.riderId.toString() !== riderId) {
        throw new AppError(StatusCodes.FORBIDDEN, "Only the rider who posted this ride can review");
    }

    if (ride.status !== RideStatus.COMPLETED) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Can only review completed rides");
    }

    if (!ride.driverId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "This ride has no assigned driver");
    }

    const existingReview = await Review.findOne({ rideId: ride._id, isDeleted: false });
    if (existingReview) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Ride has already been reviewed");
    }

    const review = await Review.create({
        rideId: ride._id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        rating: payload.rating,
        comment: payload.comment,
    });

    const driver = await User.findById(ride.driverId);
    if (driver) {
        const totalReviews = (driver.totalReviews || 0) + 1;
        const oldAverage = driver.averageRating || 0;
        const newAverage = ((oldAverage * (totalReviews - 1)) + payload.rating) / totalReviews;

        await User.findByIdAndUpdate(ride.driverId, {
            averageRating: Math.round(newAverage * 100) / 100,
            totalReviews,
        });
    }

    return review;
};

const getDriverReviews = async (driverId: string, query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Review.find({ driverId, isDeleted: false }).populate("riderId", "name picture").sort({ createdAt: -1 }),
        query
    )
        .filter()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const getRideReview = async (rideId: string) => {
    const review = await Review.findOne({ rideId, isDeleted: false });
    return review;
};

export const ReviewServices = {
    createReview,
    getDriverReviews,
    getRideReview,
};
