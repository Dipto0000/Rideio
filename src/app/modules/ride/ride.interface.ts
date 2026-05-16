import { Types } from "mongoose";

export enum VehicleType {
    BIKE = "BIKE",
    CAR = "CAR",
}

export enum RideStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export interface ILocation {
    address: string;
    lat: number;
    lng: number;
}

export interface IRide {
    _id?: Types.ObjectId;
    riderId: Types.ObjectId; // Rider who posted
    driverId?: Types.ObjectId; // Driver who accepted (optional until accepted)
    from: ILocation;
    to: ILocation;
    arrivalTime: Date;
    vehicleType: VehicleType; // Rider's preference (bike or car)
    status: RideStatus;
    systemSuggestedFare: number; // Calculated by backend
    distanceInKm?: number; // Calculated via Haversine
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
