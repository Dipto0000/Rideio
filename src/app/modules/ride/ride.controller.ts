import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { RideServices } from "./ride.service.js";
import { IAuthUser } from "../user/user.interface.js";

export const RideController = {
    createRide: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const result = await RideServices.createRide(req.body, user.userId);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: "Ride posted successfully",
            data: result,
        });
    }),

    getAllRides: catchAsync(async (req: Request, res: Response) => {
        const query = req.query as Record<string, string>;
        const result = await RideServices.getAllRides(query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Rides retrieved successfully",
            data: result.data,
            meta: result.meta,
        });
    }),

    getRideById: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser | undefined;
        const result = await RideServices.getRideById(
            req.params.id as string,
            user?.userId
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Ride details retrieved",
            data: result,
        });
    }),

    acceptRide: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const result = await RideServices.acceptRide(
            req.params.id as string,
            user.userId
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Ride accepted successfully",
            data: result,
        });
    }),

    cancelRide: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const result = await RideServices.cancelRide(
            req.params.id as string,
            user.userId
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Ride cancelled successfully",
            data: result,
        });
    }),

    startRide: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const result = await RideServices.startRide(
            req.params.id as string,
            user.userId
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Ride started successfully",
            data: result,
        });
    }),

    completeRide: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const result = await RideServices.completeRide(
            req.params.id as string,
            user.userId
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Ride completed successfully",
            data: result,
        });
    }),

    getMyRides: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const query = req.query as Record<string, string>;
        const result = await RideServices.getMyRides(user.userId, query, user.subRole as "RIDER" | "DRIVER");

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "My rides retrieved successfully",
            data: result.data,
            meta: result.meta,
        });
    }),

};
