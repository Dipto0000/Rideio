import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { NotificationServices } from "./notification.service.js";
import { IAuthUser } from "../user/user.interface.js";

export const NotificationController = {
    getNotifications: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const query = req.query as Record<string, string>;
        const result = await NotificationServices.getNotifications(
            user.userId,
            query
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Notifications retrieved",
            data: result.data,
            meta: result.meta,
        });
    }),

    getUnreadCount: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const count = await NotificationServices.getUnreadCount(user.userId);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Unread count retrieved",
            data: { count },
        });
    }),

    markAsRead: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const notificationId = req.params.id as string;
        await NotificationServices.markAsRead(user.userId, notificationId);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Notification marked as read",
        });
    }),

    markAllAsRead: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        await NotificationServices.markAllAsRead(user.userId);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "All notifications marked as read",
        });
    }),

    getSettings: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const settings = await NotificationServices.getSettings(user.userId);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Notification settings retrieved",
            data: settings,
        });
    }),

    updateSettings: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const settings = await NotificationServices.updateSettings(
            user.userId,
            req.body
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Notification settings updated",
            data: settings,
        });
    }),
};
