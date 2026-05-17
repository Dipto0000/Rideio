import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import AppError from "../../errorHelpers/AppError.js";
import { ReviewServices } from "./review.service.js";

const createReview = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const result = await ReviewServices.createReview(req.body, req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Review submitted successfully",
        data: result,
    });
});

const getDriverReviews = catchAsync(async (req, res) => {
    const query = req.query as Record<string, string>;
    const result = await ReviewServices.getDriverReviews(req.params.driverId as string, query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Driver reviews retrieved",
        data: result.data,
        meta: result.meta,
    });
});

const getRideReview = catchAsync(async (req, res) => {
    const result = await ReviewServices.getRideReview(req.params.rideId as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Ride review retrieved",
        data: result,
    });
});

export const ReviewControllers = {
    createReview,
    getDriverReviews,
    getRideReview,
};
