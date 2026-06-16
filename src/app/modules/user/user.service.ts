import { StatusCodes } from "http-status-codes";
import bcryptjs from 'bcryptjs';
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { userSearchableFields } from "./user.constant.js";
import { IAuthProvider, IUser, Role, SubRole } from "./user.interface.js";
import { User } from "./user.model.js";

const createUser = async (payload: Partial<IUser>) => {
    const { email, password, name, vehicleType, numberplate, licenseNumber, dob, role: _ignoredRole, subRole: _ignoredSubRole, ...rest } = payload;

    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User Already Exists");
    }

    // Manually hash password
    const hashedPassword = await bcryptjs.hash(
        password as string,
        Number(envVars.BCRYPT_SALT_ROUND)
    );

    const authProvider: IAuthProvider = { 
        provider: "credentials", 
        providerId: email as string 
    };

    const user = await User.create({
        email,
        password: hashedPassword,
        auths: [authProvider],
        name: name as string,
        role: Role.USER,
        subRole: SubRole.RIDER,
        vehicleType,
        numberplate,
        licenseNumber,
        dob: dob ? new Date(dob) : undefined,
        ...rest,
    });

    // Generate email verification token
    const verificationToken = jwt.sign(
        { userId: user._id, email: user.email },
        envVars.JWT_ACCESS_SECRET,
        { expiresIn: "10m" }
    );

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send confirmation email
    const verifyLink = `${envVars.FRONTEND_URL}/auth/verify?token=${verificationToken}`;
    sendEmail({
        to: user.email,
        subject: "Confirm Your Email - Rideio",
        templateName: "confirmEmail",
        templateData: {
            name: user.name,
            verifyLink,
        },
    }).catch(err => console.error("Failed to send confirmation email:", err));

    return user;
};

const updateUser = async (
    userId: string,
    payload: Partial<IUser>,
    decodedToken: JwtPayload
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
    }

    // Authorization checks
    if (decodedToken.role === Role.USER || decodedToken.subRole === SubRole.RIDER || decodedToken.subRole === SubRole.DRIVER) {
        if (userId !== decodedToken.userId) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized");
        }
    }

    if (decodedToken.role === Role.ADMIN && user.role === Role.SUPER_ADMIN) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized");
    }

    // Role/Status changes require admin privileges
    if (payload.role || payload.status || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === Role.USER || decodedToken.subRole === SubRole.RIDER || decodedToken.subRole === SubRole.DRIVER) {
            throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
        }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
    });

    return updatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(User.find(), query)
        .filter()
        .search(userSearchableFields)
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return {
        data,
        meta,
    };
};

const getSingleUser = async (id: string) => {
    const user = await User.findById(id).select("-password");
    return {
        data: user,
    };
};

const DEMO_USER_IDS = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
    '000000000000000000000004',
];

const DEMO_PROFILES: Record<string, Record<string, unknown>> = {
    '000000000000000000000001': {
        _id: '000000000000000000000001',
        name: 'Super Admin',
        email: 'superadmin@rideio.demo',
        role: 'SUPER_ADMIN',
        subRole: 'RIDER',
        picture: undefined,
        phone: undefined,
        address: undefined,
        isVerified: true,
        isDeleted: false,
        status: 'ACTIVE',
        subscription: { isSubscribed: false },
        hasPassword: true,
    },
    '000000000000000000000002': {
        _id: '000000000000000000000002',
        name: 'Admin User',
        email: 'admin@rideio.demo',
        role: 'ADMIN',
        subRole: 'RIDER',
        picture: undefined,
        phone: undefined,
        address: undefined,
        isVerified: true,
        isDeleted: false,
        status: 'ACTIVE',
        subscription: { isSubscribed: false },
        hasPassword: true,
    },
    '000000000000000000000003': {
        _id: '000000000000000000000003',
        name: 'Demo Rider',
        email: 'demo.rider@rideio.demo',
        role: 'USER',
        subRole: 'RIDER',
        picture: undefined,
        phone: undefined,
        address: undefined,
        isVerified: true,
        isDeleted: false,
        status: 'ACTIVE',
        subscription: { isSubscribed: false },
        hasPassword: true,
    },
    '000000000000000000000004': {
        _id: '000000000000000000000004',
        name: 'Demo Driver',
        email: 'demo.driver@rideio.demo',
        role: 'USER',
        subRole: 'DRIVER',
        picture: undefined,
        phone: undefined,
        address: undefined,
        isVerified: true,
        isDeleted: false,
        status: 'ACTIVE',
        vehicleType: 'car',
        subscription: { isSubscribed: true },
        hasPassword: true,
    },
};

const getMe = async (userId: string) => {
    // Handle demo users (portfolio/recruiter access)
    if (DEMO_USER_IDS.includes(userId)) {
        return {
            data: DEMO_PROFILES[userId],
        };
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Return hasPassword boolean instead of exposing the actual password hash
    const { password, ...safeUser } = user.toObject();

    return {
        data: {
            ...safeUser,
            hasPassword: !!password,
        },
    };
};

export const UserServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    getMe,
};