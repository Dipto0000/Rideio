import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { Role } from "../user/user.interface.js";
import { AdminControllers } from "./admin.controller.js";
import { createAdminValidation, updateSubscriptionStatusValidation, softDeleteValidation } from "./admin.validation.js";

const router = Router();

// Admin-only routes
router.get(
    "/users",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminControllers.getAllUsers
);

router.patch(
    "/users/:id/soft-delete",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(softDeleteValidation),
    AdminControllers.softDeleteUser
);

router.get(
    "/rides",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminControllers.getAllRides
);

router.patch(
    "/rides/:id/soft-delete",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(softDeleteValidation),
    AdminControllers.softDeleteRide
);

router.get(
    "/subscriptions",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminControllers.getAllSubscriptions
);

router.put(
    "/subscriptions/:id/status",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateSubscriptionStatusValidation),
    AdminControllers.updateSubscriptionStatus
);

router.get(
    "/deleted-records",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminControllers.getSoftDeletedRecords
);

// Super admin-only routes
router.post(
    "/super-admin/admins",
    checkAuth(Role.SUPER_ADMIN),
    validateRequest(createAdminValidation),
    AdminControllers.createAdmin
);

router.delete(
    "/super-admin/admins/:id",
    checkAuth(Role.SUPER_ADMIN),
    AdminControllers.removeAdmin
);

export const AdminRoutes = router;
