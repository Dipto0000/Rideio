import { Types } from "mongoose";

export type NotificationType =
    | 'RIDE_ACCEPTED'
    | 'RIDE_CANCELLED'
    | 'RIDE_CANCELLED_BY_DRIVER'
    | 'RIDE_STARTED'
    | 'RIDE_COMPLETED'
    | 'NEW_RIDE_AVAILABLE'
    | 'SUBSCRIPTION_EXPIRING'
    | 'SUBSCRIPTION_EXPIRED'
    | 'NEW_USER_REGISTERED'
    | 'PAYMENT_RECEIVED'
    | 'RIDE_REPORTED'
    | 'ADMIN_CREATED'
    | 'USER_DELETED'
    | 'ACCOUNT_BLOCKED';

export interface INotificationSettings {
    RIDE_ACCEPTED: boolean;
    RIDE_CANCELLED: boolean;
    RIDE_CANCELLED_BY_DRIVER: boolean;
    RIDE_STARTED: boolean;
    RIDE_COMPLETED: boolean;
    NEW_RIDE_AVAILABLE: boolean;
    SUBSCRIPTION_EXPIRING: boolean;
    SUBSCRIPTION_EXPIRED: boolean;
    NEW_USER_REGISTERED: boolean;
    PAYMENT_RECEIVED: boolean;
    RIDE_REPORTED: boolean;
    ADMIN_CREATED: boolean;
    USER_DELETED: boolean;
    ACCOUNT_BLOCKED: boolean;
}

export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    USER = "USER",
}

export enum SubRole {
    RIDER = "RIDER",
    DRIVER = "DRIVER",
}

export enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED",
}

export const IsActive = UserStatus; // Alias for compatibility with sample code

export interface IAuthProvider {
    provider: "google" | "credentials";
    providerId: string; // For credentials, this is the email. For google, it's the sub/id.
}

export interface IAuthUser {
    userId: string;
    email: string;
    role: Role;
    subRole: SubRole;
}

export interface INotification {
    _id?: Types.ObjectId;
    message: string;
    rideId?: Types.ObjectId;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
}

export interface IUser {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    picture?: string;
    phone?: string;
    address?: string;
    role: Role;
    subRole: SubRole; // CRITICAL for Rideio logic
    status: UserStatus;
    isVerified: boolean;
    verificationToken?: string; // For Email Verification
    verificationTokenExpiry?: Date;
    auths: IAuthProvider[];
    subscription: {
        isSubscribed: boolean;
        expiryDate?: Date;
    };
    // Driver-specific fields
    vehicleType?: 'bike' | 'car';
    numberplate?: string;
    licenseNumber?: string;
    dob?: Date;
    // Notifications
    notifications: INotification[];
    notificationSettings: INotificationSettings;
    // Rating fields (for drivers)
    averageRating?: number;
    totalReviews?: number;
    isDeleted: boolean;
}