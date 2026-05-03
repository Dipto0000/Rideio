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
    BLOCKED = "BLOCKED",
}

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
    isDeleted: boolean;
}