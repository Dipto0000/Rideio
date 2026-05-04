import { model, Schema } from "mongoose";
import { INotification, IUser, Role, SubRole, UserStatus } from "./user.interface.js";

const notificationSchema = new Schema<INotification>(
    {
        message: { type: String, required: true },
        rideId: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
        type: { type: String, enum: ['RIDE_CANCELLED', 'RIDE_ACCEPTED'], required: true },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, select: 0 },
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.USER,
        },
        subRole: {
            type: String,
            enum: Object.values(SubRole),
            default: SubRole.RIDER,
        },
        picture: { type: String },
        phone: { type: String },
        address: { type: String },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE,
        },
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        verificationTokenExpiry: { type: Date },
        auths: [
            {
                provider: { type: String, required: true },
                providerId: { type: String, required: true },
            },
        ],
        subscription: {
            isSubscribed: { type: Boolean, default: false },
            expiryDate: { type: Date },
        },
        // Driver-specific fields
        vehicleType: { type: String, enum: ['bike', 'car'] },
        numberplate: { type: String },
        licenseNumber: { type: String },
        dob: { type: Date },
        // Notifications
        notifications: [notificationSchema],
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const User = model<IUser>("User", userSchema);