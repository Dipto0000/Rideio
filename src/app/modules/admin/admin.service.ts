import { StatusCodes } from "http-status-codes";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { Role, UserStatus } from "../user/user.interface.js";
import { User } from "../user/user.model.js";
import { Ride } from "../ride/ride.model.js";
import { RideStatus } from "../ride/ride.interface.js";
import { Payment, SubscriptionPlan } from "../subscription/subscription.model.js";
import { PaymentStatus, PlanType } from "../subscription/subscription.interface.js";
import { DeletedModelType, ICreateAdminPayload } from "./admin.interface.js";
import { SoftDeletedRecord } from "./admin.model.js";

const getAllUsers = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        User.find({ isDeleted: false }).select("-password"),
        query
    )
        .filter()
        .search(["name", "email", "phone"])
        .sort()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const getAllRides = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Ride.find({ isDeleted: false })
            .populate("riderId", "name picture")
            .populate("driverId", "name picture vehicleType"),
        query
    )
        .filter()
        .search(["from.address", "to.address"])
        .sort()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const softDeleteUser = async (userId: string, adminId: string, reason?: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    if (user.role === Role.SUPER_ADMIN) {
        throw new AppError(StatusCodes.FORBIDDEN, "Cannot delete a super admin");
    }

    if (user.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User is already deleted");
    }

    await User.findByIdAndUpdate(userId, { isDeleted: true });

    await SoftDeletedRecord.create({
        originalModel: DeletedModelType.USER,
        originalId: userId,
        deletedBy: adminId,
        reason,
    });

    return { message: "User soft deleted successfully" };
};

const softDeleteRide = async (rideId: string, adminId: string, reason?: string) => {
    const ride = await Ride.findById(rideId);
    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if ((ride as any).isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Ride is already deleted");
    }

    await Ride.findByIdAndUpdate(rideId, { isDeleted: true });

    await SoftDeletedRecord.create({
        originalModel: DeletedModelType.RIDE,
        originalId: rideId,
        deletedBy: adminId,
        reason,
    });

    return { message: "Ride soft deleted successfully" };
};

const getAllSubscriptions = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Payment.find({ isDeleted: false }).populate("userId", "name email"),
        query
    )
        .filter()
        .sort()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const updateSubscriptionStatus = async (paymentId: string, status: PaymentStatus, adminId: string) => {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
    }

    payment.status = status;
    await payment.save();

    if (status === PaymentStatus.SUCCESS) {
        await User.findByIdAndUpdate(payment.userId, {
            "subscription.isSubscribed": true,
            "subscription.expiryDate": payment.endDate,
        });
    } else {
        await User.findByIdAndUpdate(payment.userId, {
            "subscription.isSubscribed": false,
        });
    }

    return { message: "Subscription status updated", payment };
};

const createAdmin = async (payload: ICreateAdminPayload, superAdminId: string) => {
    const superAdmin = await User.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== Role.SUPER_ADMIN) {
        throw new AppError(StatusCodes.FORBIDDEN, "Only super admins can create admins");
    }

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Email already exists");
    }

    const hashedPassword = await bcryptjs.hash(payload.password, Number(envVars.BCRYPT_SALT_ROUND));

    const admin = await User.create({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: Role.ADMIN,
        phone: payload.phone,
        subRole: "RIDER",
        isVerified: true,
        status: UserStatus.ACTIVE,
        auths: [{ provider: "credentials", providerId: payload.email }],
    });

    return { message: "Admin created successfully", admin };
};

const removeAdmin = async (adminId: string, superAdminId: string) => {
    const superAdmin = await User.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== Role.SUPER_ADMIN) {
        throw new AppError(StatusCodes.FORBIDDEN, "Only super admins can remove admins");
    }

    if (adminId === superAdminId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Cannot remove yourself");
    }

    const admin = await User.findById(adminId);
    if (!admin) {
        throw new AppError(StatusCodes.NOT_FOUND, "Admin not found");
    }

    if (admin.role !== Role.ADMIN) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User is not an admin");
    }

    admin.role = Role.USER;
    await admin.save();

    return { message: "Admin removed successfully" };
};

const getSoftDeletedRecords = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        SoftDeletedRecord.find().populate("deletedBy", "name email").sort({ deletedAt: -1 }),
        query
    )
        .filter()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

export const AdminServices = {
    getAllUsers,
    getAllRides,
    softDeleteUser,
    softDeleteRide,
    getAllSubscriptions,
    updateSubscriptionStatus,
    createAdmin,
    removeAdmin,
    getSoftDeletedRecords,
};
