import { Types } from "mongoose";

export enum DeletedModelType {
    USER = "User",
    RIDE = "Ride",
}

export interface ISoftDeletedRecord {
    _id?: Types.ObjectId;
    originalModel: DeletedModelType;
    originalId: string;
    deletedBy: Types.ObjectId;
    deletedAt: Date;
    reason?: string;
}

export interface ICreateAdminPayload {
    name: string;
    email: string;
    password: string;
    phone?: string;
}
