import { model, Schema } from "mongoose";
import { IUser, Role, SubRole, UserStatus } from "./user.interface.js";

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: 0 },
    role: { 
        type: String, 
        enum: Object.values(Role), 
        default: Role.USER 
    },
    subRole: { 
        type: String, 
        enum: Object.values(SubRole), 
        default: SubRole.RIDER 
    },
    picture: { type: String },
    status: { 
        type: String, 
        enum: Object.values(UserStatus), 
        default: UserStatus.ACTIVE 
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    auths: [{
        provider: { type: String, required: true },
        providerId: { type: String, required: true }
    }],
    subscription: {
        isSubscribed: { type: Boolean, default: false },
        expiryDate: { type: Date }
    },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false
});

export const User = model<IUser>("User", userSchema);