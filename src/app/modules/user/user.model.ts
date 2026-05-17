import { model, Schema } from "mongoose";
import {
    INotification,
    IUser,
    Role,
    SubRole,
    UserStatus,
} from "./user.interface.js";

const NOTIFICATION_TYPE_ENUMS = [
    'RIDE_ACCEPTED',
    'RIDE_CANCELLED',
    'RIDE_CANCELLED_BY_DRIVER',
    'RIDE_STARTED',
    'RIDE_COMPLETED',
    'NEW_RIDE_AVAILABLE',
    'SUBSCRIPTION_EXPIRING',
    'SUBSCRIPTION_EXPIRED',
    'NEW_USER_REGISTERED',
    'PAYMENT_RECEIVED',
    'RIDE_REPORTED',
    'ADMIN_CREATED',
    'USER_DELETED',
    'ACCOUNT_BLOCKED',
] as const;

const notificationSchema = new Schema<INotification>(
    {
        message: { type: String, required: true },
        rideId: { type: Schema.Types.ObjectId, ref: "Ride" },
        type: {
            type: String,
            required: true,
            enum: NOTIFICATION_TYPE_ENUMS,
        },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    }
);

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, maxlength: 100 },
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
        phone: { type: String, maxlength: 20 },
        address: { type: String, maxlength: 500 },
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
        numberplate: { type: String, maxlength: 20 },
        licenseNumber: { type: String, maxlength: 50 },
        dob: { type: Date },
        // Notifications
        notifications: [notificationSchema],
        notificationSettings: {
            type: new Schema(
                {
                    RIDE_ACCEPTED: { type: Boolean, default: true },
                    RIDE_CANCELLED: { type: Boolean, default: true },
                    RIDE_CANCELLED_BY_DRIVER: { type: Boolean, default: true },
                    RIDE_STARTED: { type: Boolean, default: true },
                    RIDE_COMPLETED: { type: Boolean, default: true },
                    NEW_RIDE_AVAILABLE: { type: Boolean, default: true },
                    SUBSCRIPTION_EXPIRING: { type: Boolean, default: true },
                    SUBSCRIPTION_EXPIRED: { type: Boolean, default: true },
                    NEW_USER_REGISTERED: { type: Boolean, default: true },
                    PAYMENT_RECEIVED: { type: Boolean, default: true },
                    RIDE_REPORTED: { type: Boolean, default: true },
                    ADMIN_CREATED: { type: Boolean, default: true },
                    USER_DELETED: { type: Boolean, default: true },
                    ACCOUNT_BLOCKED: { type: Boolean, default: true },
                },
                { _id: false }
            ),
            default: {},
        },
        // Rating fields (for drivers)
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Auto-filter soft-deleted documents
userSchema.pre("find", function () {
    this.where({ isDeleted: { $ne: true } });
});
userSchema.pre("findOne", function () {
    this.where({ isDeleted: { $ne: true } });
});

export const User = model<IUser>("User", userSchema);