import { z } from "zod/v4";
import { RideStatus, VehicleType } from "./ride.interface.js";

export const createRideValidation = z.object({
    from: z.object({
        address: z.string().min(1, "From address is required"),
        lat: z.number(),
        lng: z.number(),
    }),
    to: z.object({
        address: z.string().min(1, "To address is required"),
        lat: z.number(),
        lng: z.number(),
    }),
    arrivalTime: z.coerce.date(),
    vehicleType: z.enum([
        VehicleType.BIKE,
        VehicleType.CAR,
    ]),
    phone: z.string().optional(),
});

export const updateRideStatusValidation = z.object({
    status: z.enum([
        RideStatus.ACCEPTED,
        RideStatus.IN_PROGRESS,
        RideStatus.COMPLETED,
        RideStatus.CANCELLED,
    ]),
});
