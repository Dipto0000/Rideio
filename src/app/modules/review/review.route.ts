import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { ReviewControllers } from "./review.controller.js";
import { createReviewValidation } from "./review.validation.js";

const router = Router();

router.post(
    "/",
    checkAuth(),
    validateRequest(createReviewValidation),
    ReviewControllers.createReview
);

router.get(
    "/driver/:driverId",
    ReviewControllers.getDriverReviews
);

router.get(
    "/ride/:rideId",
    ReviewControllers.getRideReview
);

export const ReviewRoutes = router;
