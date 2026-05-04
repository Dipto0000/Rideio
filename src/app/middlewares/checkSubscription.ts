import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { User } from "../modules/user/user.model.js";
import { SubRole } from "../modules/user/user.interface.js";
import AppError from "../errorHelpers/AppError.js";

export const checkSubscription = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const driverId = req.user?.userId;
    const subRole = req.user?.subRole;

    if (!driverId) {
        return next(new AppError(StatusCodes.UNAUTHORIZED, "Authentication required"));
    }

    if (subRole !== SubRole.DRIVER) {
        return next(new AppError(StatusCodes.FORBIDDEN, "Only drivers can access this resource"));
    }

    const user = await User.findById(driverId).select("subscription");

    if (!user?.subscription?.isSubscribed) {
        return next(
            new AppError(
                StatusCodes.FORBIDDEN,
                "Subscription required to accept rides. Please subscribe first."
            )
        );
    }

    if (user.subscription.expiryDate && user.subscription.expiryDate < new Date()) {
        return next(
            new AppError(
                StatusCodes.FORBIDDEN,
                "Subscription expired. Please renew your subscription."
            )
        );
    }

    next();
};
