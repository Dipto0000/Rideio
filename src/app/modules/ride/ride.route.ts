import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { checkSubscription } from "../../middlewares/checkSubscription.js";
import { RideController } from "./ride.controller.js";
import { createRideValidation, updateRideStatusValidation } from "./ride.validation.js";

const router = Router();

// Public routes
router.post(
    "/",
    checkAuth(),
    validateRequest(createRideValidation),
    RideController.createRide
);

router.get("/", RideController.getAllRides);

// Rider routes (must be before /:id to avoid matching "my-rides" as an id)
router.get("/my-rides", checkAuth(), RideController.getMyRides);

router.get("/:id", RideController.getRideById);

router.patch(
    "/:id/cancel",
    checkAuth(),
    RideController.cancelRide
);

// Driver routes
router.patch(
    "/:id/accept",
    checkAuth(),
    checkSubscription,
    RideController.acceptRide
);

router.patch(
    "/:id/start",
    checkAuth(),
    checkSubscription,
    RideController.startRide
);

router.patch(
    "/:id/complete",
    checkAuth(),
    checkSubscription,
    RideController.completeRide
);



export const RideRoutes = router;
