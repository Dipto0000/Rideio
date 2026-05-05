import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { Role, SubRole } from "../user/user.interface.js";
import { DashboardControllers } from "./dashboard.controller.js";

const router = Router();

router.get(
    "/driver",
    checkAuth(SubRole.DRIVER),
    DashboardControllers.getDriverDashboard
);

router.get(
    "/rider",
    checkAuth(SubRole.RIDER),
    DashboardControllers.getRiderDashboard
);

router.get(
    "/admin",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DashboardControllers.getAdminDashboard
);

export const DashboardRoutes = router;
