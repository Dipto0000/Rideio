import httpStatus from "http-status-codes";
import bcryptjs from 'bcryptjs';
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { userSearchableFields } from "./user.constant.js";
import { IAuthProvider, IUser, Role, SubRole } from "./user.interface.js";
import { User } from "./user.model.js";

const createUser = async (payload: Partial<IUser>) => {
    const { email, password, ...rest } = payload;

    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exists");
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
        ...rest,
    });

    return user;
};

const updateUser = async (
    userId: string,
    payload: Partial<IUser>,
    decodedToken: JwtPayload
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }

    // Authorization checks
    if (decodedToken.role === Role.USER || decodedToken.subRole === SubRole.RIDER || decodedToken.subRole === SubRole.DRIVER) {
        if (userId !== decodedToken.userId) {
            throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
        }
    }

    if (decodedToken.role === Role.ADMIN && user.role === Role.SUPER_ADMIN) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // Role/Status changes require admin privileges
    if (payload.role || payload.status || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === Role.USER || decodedToken.subRole === SubRole.RIDER || decodedToken.subRole === SubRole.DRIVER) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
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

const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    return {
        data: user,
    };
};

export const UserServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    getMe,
};