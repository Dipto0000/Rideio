import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status-codes";
import { User } from "../modules/user/user.model.js";
import AppError from "../errorHelpers/AppError.js";

export const checkSubscription = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const driverId = req.user?.userId;

    if (!driverId) {
        return next(new AppError(httpStatus.UNAUTHORIZED, "Authentication required"));
    }

    const user = await User.findById(driverId).select("subscription");

    if (!user?.subscription?.isSubscribed) {
        return next(
            new AppError(
                httpStatus.FORBIDDEN,
                "Subscription required to accept rides. Please subscribe first."
            )
        );
    }

    if (user.subscription.expiryDate && user.subscription.expiryDate < new Date()) {
        return next(
            new AppError(
                httpStatus.FORBIDDEN,
                "Subscription expired. Please renew your subscription."
            )
        );
    }

    next();
};
