import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AdminServices } from "./admin.service.js";

const getAllUsers = catchAsync(async (req, res) => {
    const query = req.query as Record<string, string>;
    const result = await AdminServices.getAllUsers(query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getAllRides = catchAsync(async (req, res) => {
    const query = req.query as Record<string, string>;
    const result = await AdminServices.getAllRides(query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Rides retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const softDeleteUser = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await AdminServices.softDeleteUser(req.params.id as string, req.user.userId, req.body.reason);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

const softDeleteRide = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await AdminServices.softDeleteRide(req.params.id as string, req.user.userId, req.body.reason);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

const getAllSubscriptions = catchAsync(async (req, res) => {
    const query = req.query as Record<string, string>;
    const result = await AdminServices.getAllSubscriptions(query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Subscriptions retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const updateSubscriptionStatus = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await AdminServices.updateSubscriptionStatus(req.params.id as string, req.body.status, req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.payment,
    });
});

const createAdmin = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await AdminServices.createAdmin(req.body, req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: result.message,
        data: result.admin,
    });
});

const removeAdmin = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await AdminServices.removeAdmin(req.params.id as string, req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

const getSoftDeletedRecords = catchAsync(async (req, res) => {
    const query = req.query as Record<string, string>;
    const result = await AdminServices.getSoftDeletedRecords(query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Deleted records retrieved",
        data: result.data,
        meta: result.meta,
    });
});

export const AdminControllers = {
    getAllUsers,
    getAllRides,
    softDeleteUser,
    softDeleteRide,
    getAllSubscriptions,
    updateSubscriptionStatus,
    createAdmin,
    removeAdmin,
    getSoftDeletedRecords,
};
