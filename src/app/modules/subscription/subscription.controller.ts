import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { SubscriptionServices } from "./subscription.service.js";

const initPayment = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await SubscriptionServices.initPayment(req.user.userId, req.body.planType);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment initiated",
        data: result,
    });
});

const handleSuccess = catchAsync(async (req, res) => {
    const result = await SubscriptionServices.handleSuccess(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.payment,
    });
});

const handleCancel = catchAsync(async (req, res) => {
    const result = await SubscriptionServices.handleCancel(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.payment,
    });
});

const handleFail = catchAsync(async (req, res) => {
    const result = await SubscriptionServices.handleFail(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.payment,
    });
});

const handleIPN = catchAsync(async (req, res) => {
    const result = await SubscriptionServices.handleIPN(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.payment,
    });
});

const getPaymentHistory = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await SubscriptionServices.getPaymentHistory(req.user.userId, req.query as Record<string, string>);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment history retrieved",
        data: result.data,
        meta: result.meta,
    });
});

const getSubscriptionStatus = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }

    const result = await SubscriptionServices.getSubscriptionStatus(req.user.userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Subscription status retrieved",
        data: result,
    });
});

export const SubscriptionControllers = {
    initPayment,
    handleSuccess,
    handleCancel,
    handleFail,
    handleIPN,
    getPaymentHistory,
    getSubscriptionStatus,
};
