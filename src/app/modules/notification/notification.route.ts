import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { NotificationController } from "./notification.controller.js";

const router = Router();

// All notification routes require authentication
router.get("/", checkAuth(), NotificationController.getNotifications);

router.get(
    "/unread-count",
    checkAuth(),
    NotificationController.getUnreadCount
);

router.patch(
    "/:id/read",
    checkAuth(),
    NotificationController.markAsRead
);

router.patch(
    "/read-all",
    checkAuth(),
    NotificationController.markAllAsRead
);

router.get(
    "/settings",
    checkAuth(),
    NotificationController.getSettings
);

router.patch(
    "/settings",
    checkAuth(),
    NotificationController.updateSettings
);

export const NotificationRoutes = router;
