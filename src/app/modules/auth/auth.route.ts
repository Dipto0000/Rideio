import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { parseFormData } from "../../middlewares/parseFormData.js";
import { multerUpload } from "../../config/multer.config.js";
import { AuthControllers } from "./auth.controller.js";
import { authValidation } from "./auth.validation.js";

const router = Router();

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: { success: false, message: "Too many attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour
    message: { success: false, message: "Too many registration attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes
router.post(
    "/login",
    authLimiter,
    validateRequest(authValidation.loginValidation),
    AuthControllers.credentialsLogin
);

router.post(
    "/google-auth",
    validateRequest(authValidation.googleAuthValidation),
    AuthControllers.handleGoogleAuth
);

router.post(
    "/register/rider",
    registerLimiter,
    parseFormData,
    multerUpload.single('profilePicture'),
    validateRequest(authValidation.registerRiderValidation),
    AuthControllers.registerRider
);

router.post(
    "/register/driver",
    registerLimiter,
    parseFormData,
    multerUpload.single('profilePicture'),
    validateRequest(authValidation.registerDriverValidation),
    AuthControllers.registerDriver
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
    authLimiter,
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
    authLimiter,
    AuthControllers.getNewAccessToken
);

// Demo login route (bypasses real auth for portfolio/recruiter access)
router.post(
    "/demo-login",
    authLimiter,
    validateRequest(authValidation.demoLoginValidation),
    AuthControllers.demoLogin
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
