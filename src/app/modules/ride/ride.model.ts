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
        systemSuggestedFare: { type: Number, required: true },
        distanceInKm: { type: Number },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Auto-filter soft-deleted documents
rideSchema.pre("find", function () {
    this.where({ isDeleted: { $ne: true } });
});
rideSchema.pre("findOne", function () {
    this.where({ isDeleted: { $ne: true } });
});

// Indexes for common query patterns
rideSchema.index({ status: 1 });
rideSchema.index({ riderId: 1 });
rideSchema.index({ driverId: 1 });
rideSchema.index({ riderId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index({ isDeleted: 1, status: 1 });

export const Ride = model<IRide>("Ride", rideSchema);
