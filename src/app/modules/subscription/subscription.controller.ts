import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import AppError from "../../errorHelpers/AppError.js";
import { SubscriptionServices } from "./subscription.service.js";
import { envVars } from "../../config/env.js";

const initPayment = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
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
    const tranId = req.body.tran_id || "";
    res.redirect(302, `${envVars.FRONTEND_URL}/subscription/result?status=success&tran_id=${tranId}`);
});

const handleCancel = catchAsync(async (req, res) => {
    await SubscriptionServices.handleCancel(req.body);
    res.redirect(302, `${envVars.FRONTEND_URL}/subscription/result?status=cancelled`);
});

const handleFail = catchAsync(async (req, res) => {
    await SubscriptionServices.handleFail(req.body);
    res.redirect(302, `${envVars.FRONTEND_URL}/subscription/result?status=failed`);
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
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
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
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
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
