import { Types } from "mongoose";

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
    message: string;
    rideId: Types.ObjectId;
    type: 'RIDE_CANCELLED' | 'RIDE_ACCEPTED';
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
    isDeleted: boolean;
}