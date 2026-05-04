import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { SubscriptionControllers } from "./subscription.controller.js";
import { initPaymentValidation, sslCallbackValidation } from "./subscription.validation.js";

const router = Router();

// Protected routes
router.post(
    "/init",
    checkAuth(),
    validateRequest(initPaymentValidation),
    SubscriptionControllers.initPayment
);

router.get(
    "/history",
    checkAuth(),
    SubscriptionControllers.getPaymentHistory
);

router.get(
    "/status",
    checkAuth(),
    SubscriptionControllers.getSubscriptionStatus
);

// Public callback routes (SSLCommerz redirects here)
router.post(
    "/success",
    validateRequest(sslCallbackValidation),
    SubscriptionControllers.handleSuccess
);

router.post(
    "/cancel",
    SubscriptionControllers.handleCancel
);

router.post(
    "/fail",
    SubscriptionControllers.handleFail
);

// IPN webhook (SSLCommerz sends async status updates)
router.post(
    "/ipn",
    SubscriptionControllers.handleIPN
);

export const SubscriptionRoutes = router;
