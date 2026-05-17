import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import AppError from "../../errorHelpers/AppError.js";
import { DashboardServices } from "./dashboard.service.js";

const getDriverDashboard = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const result = await DashboardServices.getDriverDashboard(req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Driver dashboard data retrieved",
        data: result,
    });
});

const getRiderDashboard = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const result = await DashboardServices.getRiderDashboard(req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Rider dashboard data retrieved",
        data: result,
    });
});

const getAdminDashboard = catchAsync(async (req, res) => {
    const result = await DashboardServices.getAdminDashboard();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Admin dashboard data retrieved",
        data: result,
    });
});

export const DashboardControllers = {
    getDriverDashboard,
    getRiderDashboard,
    getAdminDashboard,
};
