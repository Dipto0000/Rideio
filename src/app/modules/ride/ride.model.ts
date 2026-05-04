import { model, Schema } from "mongoose";
import { ILocation, IRide, RideStatus, VehicleType } from "./ride.interface.js";

const locationSchema = new Schema<ILocation>(
    {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    { _id: false }
);

const rideSchema = new Schema<IRide>(
    {
        riderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        driverId: { type: Schema.Types.ObjectId, ref: "User" },
        from: { type: locationSchema, required: true },
        to: { type: locationSchema, required: true },
        arrivalTime: { type: Date, required: true },
        vehicleType: {
            type: String,
            enum: Object.values(VehicleType),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(RideStatus),
            default: RideStatus.PENDING,
        },
        proposedFare: { type: Number, required: true },
        systemSuggestedFare: { type: Number },
        distanceInKm: { type: Number },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const Ride = model<IRide>("Ride", rideSchema);
