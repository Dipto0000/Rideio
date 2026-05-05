import { Types } from "mongoose";

export interface IReview {
    _id?: Types.ObjectId;
    rideId: Types.ObjectId;
    riderId: Types.ObjectId;
    driverId: Types.ObjectId;
    rating: number;
    comment?: string;
    isDeleted: boolean;
}
