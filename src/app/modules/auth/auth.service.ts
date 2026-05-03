import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { createNewAccessTokenWithRefreshToken, createUserTokens } from "../../utils/usertokens.js";
import { IAuthProvider, IsActive, IUser, Role, SubRole } from "../user/user.interface.js";
import { User } from "../user/user.model.js";

const credentialsLogin = async (payload: { email: string; password: string }) => {
    const { email, password } = payload;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    if (!user.password) {
        throw new AppError(httpStatus.BAD_REQUEST, "Please log in with Google or set a password first");
    }

    const isPasswordMatched = await bcryptjs.compare(password, user.password);

    if (!isPasswordMatched) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    if (!user.isVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "Please verify your email first");
    }

    if (user.status === IsActive.BLOCKED || user.status === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User is ${user.status}`);
    }

    if (user.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
    }

    const userTokens = createUserTokens(
        user._id.toString(),
        user.email,
        user.role,
        user.subRole
    );
    const { password: pass, ...rest } = user.toObject();

    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest,
    };
};

const handleGoogleAuth = async (payload: { email: string; name: string; googleId: string; picture?: string }) => {
    const { email, name, googleId, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
        const hasGoogleAuth = user.auths.some((auth) => auth.provider === "google");
        if (!hasGoogleAuth) {
            user.auths.push({ provider: "google", providerId: googleId } as IAuthProvider);
            await user.save();
        }
    } else {
        user = await User.create({
            email,
            name,
            picture,
            role: Role.USER,
            subRole: SubRole.RIDER,
            isVerified: true,
            auths: [{ provider: "google", providerId: googleId } as IAuthProvider],
            status: IsActive.ACTIVE,
            isDeleted: false,
            subscription: { isSubscribed: false },
        });
    }

    const userTokens = createUserTokens(
        user._id.toString(),
        user.email,
        user.role,
        user.subRole
    );
    const { password: pass, ...rest } = user.toObject();

    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest,
    };
};

const verifyEmail = async (token: string) => {
    try {
        const decoded = jwt.verify(token, envVars.JWT_ACCESS_SECRET) as JwtPayload;
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AppError(httpStatus.BAD_REQUEST, "Invalid token");
        }

        if (user.isVerified) {
            // Return tokens if already verified (edge case: user lost tokens)
            const userTokens = createUserTokens(
                user._id.toString(),
                user.email,
                user.role,
                user.subRole
            );
            const { password: pass, ...rest } = user.toObject();
            return {
                message: "Email already verified",
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
                user: rest,
            };
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        // Generate tokens for auto-login
        const userTokens = createUserTokens(
            user._id.toString(),
            user.email,
            user.role,
            user.subRole
        );
        const { password: pass, ...rest } = user.toObject();

        return {
            message: "Email verified successfully",
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
            user: rest,
        };
    } catch (error) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired token");
    }
};

const resendConfirmation = async (email: string) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User not found");
    }

    if (user.isVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email already verified");
    }

    const verificationToken = jwt.sign(
        { userId: user._id, email: user.email },
        envVars.JWT_ACCESS_SECRET,
        { expiresIn: "10m" }
    );

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const confirmLink = `${envVars.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
        to: user.email,
        subject: "Confirm Your Email - Rideio",
        templateName: "confirmEmail",
        templateData: {
            name: user.name,
            confirmLink,
        },
    });

    return { message: "Confirmation email resent" };
};

const forgotPassword = async (email: string) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
    }

    if (!user.isVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is not verified");
    }

    if (user.status === IsActive.BLOCKED || user.status === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User is ${user.status}`);
    }

    if (user.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
    }

    const resetToken = jwt.sign(
        { userId: user._id, email: user.email },
        envVars.JWT_ACCESS_SECRET,
        { expiresIn: "10m" }
    );

    const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${user._id}&token=${resetToken}`;

    await sendEmail({
        to: user.email,
        subject: "Password Reset - Rideio",
        templateName: "forgetPassword",
        templateData: {
            name: user.name,
            resetUILink,
        },
    });

    return { message: "Password reset email sent" };
};

const resetPassword = async (payload: { newPassword: string; token: string }) => {
    try {
        const decoded = jwt.verify(payload.token, envVars.JWT_ACCESS_SECRET) as JwtPayload;
        const user = await User.findById(decoded.userId).select("+password");

        if (!user) {
            throw new AppError(httpStatus.BAD_REQUEST, "User not found");
        }

        const hashedPassword = await bcryptjs.hash(
            payload.newPassword,
            Number(envVars.BCRYPT_SALT_ROUND)
        );

        user.password = hashedPassword;
        await user.save();

        return { message: "Password reset successfully" };
    } catch (error) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired token");
    }
};

const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
    const user = await User.findById(decodedToken.userId).select("+password");

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user.password as string);
    if (!isOldPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match");
    }

    user.password = await bcryptjs.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND));
    await user.save();

    return { message: "Password changed successfully" };
};

const setPassword = async (userId: string, plainPassword: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const hasCredentials = user.auths.some((auth) => auth.provider === "credentials");
    if (hasCredentials) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already set your password");
    }

    const hashedPassword = await bcryptjs.hash(
        plainPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    );

    const credentialProvider: IAuthProvider = {
        provider: "credentials",
        providerId: user.email,
    };

    user.password = hashedPassword;
    user.auths.push(credentialProvider);
    await user.save();

    return { message: "Password set successfully" };
};

const getNewAccessToken = async (refreshToken: string) => {
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
    return {
        accessToken: newAccessToken,
    };
};

export const AuthServices = {
    credentialsLogin,
    handleGoogleAuth,
    verifyEmail,
    resendConfirmation,
    forgotPassword,
    resetPassword,
    changePassword,
    setPassword,
    getNewAccessToken,
};
