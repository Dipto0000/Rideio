import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import { User } from "../user/user.model.js";
import type { INotificationSettings, NotificationType } from "../user/user.interface.js";

const DEFAULT_SETTINGS: INotificationSettings = {
    RIDE_ACCEPTED: true,
    RIDE_CANCELLED: true,
    RIDE_CANCELLED_BY_DRIVER: true,
    RIDE_STARTED: true,
    RIDE_COMPLETED: true,
    NEW_RIDE_AVAILABLE: true,
    SUBSCRIPTION_EXPIRING: true,
    SUBSCRIPTION_EXPIRED: true,
    NEW_USER_REGISTERED: true,
    PAYMENT_RECEIVED: true,
    RIDE_REPORTED: true,
    ADMIN_CREATED: true,
    USER_DELETED: true,
    ACCOUNT_BLOCKED: true,
};

const getNotifications = async (
    userId: string,
    query: Record<string, string>
) => {
    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20")));

    const user = await User.findById(userId).select("notifications");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const total = user.notifications.length;
    const totalPage = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const notifications = user.notifications
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        )
        .slice(skip, skip + limit);

    return {
        data: notifications,
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
    };
};

const getUnreadCount = async (userId: string) => {
    const user = await User.findById(userId).select("notifications");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const count = user.notifications.filter((n) => !n.isRead).length;
    return count;
};

const markAsRead = async (userId: string, notificationId: string) => {
    const user = await User.findById(userId).select("notifications");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const notification = (user.notifications as unknown as { id: (id: string) => Record<string, unknown> | null }).id(notificationId);
    if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
    }

    notification.isRead = true;
    await user.save();
};

const markAllAsRead = async (userId: string) => {
    await User.findByIdAndUpdate(userId, {
        $set: { "notifications.$[].isRead": true },
    });
};

const getSettings = async (userId: string) => {
    const user = await User.findById(userId).select("notificationSettings");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user.notificationSettings || DEFAULT_SETTINGS;
};

const updateSettings = async (
    userId: string,
    settings: Partial<INotificationSettings>
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Merge with existing settings
    const merged = {
        ...DEFAULT_SETTINGS,
        ...(user.notificationSettings || {}),
        ...settings,
    };

    user.notificationSettings = merged as INotificationSettings;
    await user.save();

    return user.notificationSettings;
};

/**
 * Push a notification to a specific user.
 * This is used by other services (ride, subscription, admin) to emit notifications.
 */
const pushNotification = async (
    userId: string,
    notification: {
        message: string;
        type: NotificationType;
        rideId?: string;
    }
) => {
    await User.findByIdAndUpdate(userId, {
        $push: {
            notifications: {
                message: notification.message,
                type: notification.type,
                rideId: notification.rideId,
                isRead: false,
                createdAt: new Date(),
            },
        },
    });
};

export const NotificationServices = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    getSettings,
    updateSettings,
    pushNotification,
};
