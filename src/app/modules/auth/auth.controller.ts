import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AuthServices } from "./auth.service.js";
import { StatusCodes } from "http-status-codes";

const credentialsLogin = catchAsync(async (req, res) => {
    const result = await AuthServices.credentialsLogin(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Login successful",
        data: result,
    });
});

const handleGoogleAuth = catchAsync(async (req, res) => {
    const result = await AuthServices.handleGoogleAuth(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Google login successful",
        data: result,
    });
});

const registerRider = catchAsync(async (req, res) => {
    const picture = req.file ? (req.file as any).path || (req.file as any).secure_url : undefined;
    const result = await AuthServices.registerWithCredentials({
        ...req.body,
        picture,
        role: "USER",
        subRole: "RIDER"
    });
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Rider registered successfully. Please verify your email.",
        data: result,
    });
});

const registerDriver = catchAsync(async (req, res) => {
    const picture = req.file ? (req.file as any).path || (req.file as any).secure_url : undefined;
    const result = await AuthServices.registerWithCredentials({
        ...req.body,
        picture,
        role: "USER",
        subRole: "DRIVER"
    });
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Driver registered successfully. Please verify your email.",
        data: result,
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    const result = await AuthServices.verifyEmail(req.body.token || req.query.token as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const resendConfirmation = catchAsync(async (req, res) => {
    const result = await AuthServices.resendConfirmation(req.body.email);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const forgotPassword = catchAsync(async (req, res) => {
    const result = await AuthServices.forgotPassword(req.body.email);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const result = await AuthServices.resetPassword({
        newPassword: req.body.newPassword,
        token: req.body.token || req.query.token as string,
    });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const changePassword = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }
    const result = await AuthServices.changePassword(
        req.body.oldPassword,
        req.body.newPassword,
        req.user
    );
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const setPassword = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new Error("User not authenticated");
    }
    const result = await AuthServices.setPassword(
        req.user.userId,
        req.body.password
    );
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

const getNewAccessToken = catchAsync(async (req, res) => {
    const result = await AuthServices.getNewAccessToken(req.body.refreshToken);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Access token generated",
        data: result,
    });
});

export const AuthControllers = {
    credentialsLogin,
    handleGoogleAuth,
    registerRider,
    registerDriver,
    verifyEmail,
    resendConfirmation,
    forgotPassword,
    resetPassword,
    changePassword,
    setPassword,
    getNewAccessToken,
};
