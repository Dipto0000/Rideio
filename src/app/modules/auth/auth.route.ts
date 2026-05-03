import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { AuthControllers } from "./auth.controller.js";
import { authValidation } from "./auth.validation.js";

const router = Router();

// Public routes
router.post(
    "/login",
    validateRequest(authValidation.loginValidation),
    AuthControllers.credentialsLogin
);

router.post(
    "/google-auth",
    validateRequest(authValidation.googleAuthValidation),
    AuthControllers.handleGoogleAuth
);

router.post(
    "/verify-email",
    validateRequest(authValidation.verifyEmailValidation),
    AuthControllers.verifyEmail
);

router.post(
    "/resend-confirmation",
    validateRequest(authValidation.forgotPasswordValidation),
    AuthControllers.resendConfirmation
);

router.post(
    "/forgot-password",
    validateRequest(authValidation.forgotPasswordValidation),
    AuthControllers.forgotPassword
);

router.post(
    "/reset-password",
    validateRequest(authValidation.resetPasswordValidation),
    AuthControllers.resetPassword
);

router.post(
    "/refresh-token",
    AuthControllers.getNewAccessToken
);

// Protected routes (require authentication)
router.post(
    "/change-password",
    checkAuth(),
    validateRequest(authValidation.changePasswordValidation),
    AuthControllers.changePassword
);

router.post(
    "/set-password",
    checkAuth(),
    validateRequest(authValidation.setPasswordValidation),
    AuthControllers.setPassword
);

export const AuthRoutes = router;
