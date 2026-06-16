import { StatusCodes } from 'http-status-codes';
import { envVars } from '../../config/env.js';
import AppError from '../../errorHelpers/AppError.js';
import { generateToken } from '../../utils/jwt.js';
import { Role, SubRole } from '../user/user.interface.js';
import { createUserTokens } from '../../utils/usertokens.js';

// Demo user profiles — realistic mock data for each role
const DEMO_USERS: Record<string, { userId: string; name: string; email: string; role: Role; subRole: SubRole }> = {
    SUPER_ADMIN: {
        userId: '000000000000000000000001',
        name: 'Super Admin',
        email: 'superadmin@rideio.demo',
        role: Role.SUPER_ADMIN,
        subRole: SubRole.RIDER,
    },
    ADMIN: {
        userId: '000000000000000000000002',
        name: 'Admin User',
        email: 'admin@rideio.demo',
        role: Role.ADMIN,
        subRole: SubRole.RIDER,
    },
    RIDER: {
        userId: '000000000000000000000003',
        name: 'Demo Rider',
        email: 'demo.rider@rideio.demo',
        role: Role.USER,
        subRole: SubRole.RIDER,
    },
    DRIVER: {
        userId: '000000000000000000000004',
        name: 'Demo Driver',
        email: 'demo.driver@rideio.demo',
        role: Role.USER,
        subRole: SubRole.DRIVER,
    },
};

type DemoRole = keyof typeof DEMO_USERS;

const VALID_ROLES: DemoRole[] = ['SUPER_ADMIN', 'ADMIN', 'RIDER', 'DRIVER'];

export const demoLogin = async (role: string) => {
    const normalizedRole = role.toUpperCase();

    if (!VALID_ROLES.includes(normalizedRole as DemoRole)) {
        throw new AppError(StatusCodes.BAD_REQUEST, `Invalid demo role. Valid roles: ${VALID_ROLES.join(', ')}`);
    }

    const demoUser = DEMO_USERS[normalizedRole as DemoRole];

    // Generate tokens with 2-hour expiry for demo sessions
    const tokens = createUserTokens(
        demoUser.userId,
        demoUser.email,
        demoUser.role,
        demoUser.subRole,
    );

    return {
        user: {
            _id: demoUser.userId,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            subRole: demoUser.subRole,
            picture: undefined,
            phone: undefined,
            address: undefined,
            isVerified: true,
            subscription: { isSubscribed: normalizedRole === 'DRIVER' },
            vehicleType: normalizedRole === 'DRIVER' ? 'car' : undefined,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    };
};
