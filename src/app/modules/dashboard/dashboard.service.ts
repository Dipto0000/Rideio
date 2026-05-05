import { StatusCodes } from "http-status-codes";
import { Ride } from "../ride/ride.model.js";
import { RideStatus } from "../ride/ride.interface.js";
import { User } from "../user/user.model.js";
import { Review } from "../review/review.model.js";
import { Payment } from "../subscription/subscription.model.js";
import { PaymentStatus } from "../subscription/subscription.interface.js";
import AppError from "../../errorHelpers/AppError.js";

const dashboardCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const getCached = <T>(key: string): T | null => {
    const cached = dashboardCache.get(key);
    if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
    }
    dashboardCache.delete(key);
    return null;
};

const setCached = (key: string, data: any) => {
    dashboardCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
};

const getDriverDashboard = async (driverId: string) => {
    const cacheKey = `driver:${driverId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const user = await User.findById(driverId).select("subscription averageRating totalReviews");
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const [completedRides, recentRides] = await Promise.all([
        Ride.find({ driverId, status: RideStatus.COMPLETED }).select("proposedFare"),
        Ride.find({ driverId })
            .populate("riderId", "name picture")
            .sort({ createdAt: -1 })
            .limit(10)
            .select("from to status proposedFare createdAt"),
    ]);

    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.proposedFare || 0), 0);

    const result = {
        totalEarnings,
        totalRidesCompleted: completedRides.length,
        averageRating: user.averageRating || 0,
        totalReviews: user.totalReviews || 0,
        subscriptionStatus: {
            isSubscribed: user.subscription.isSubscribed,
            expiryDate: user.subscription.expiryDate,
        },
        recentRides: recentRides.map((ride) => ({
            _id: ride._id,
            riderName: (ride.riderId as any)?.name || "Anonymous",
            from: { address: ride.from.address },
            to: { address: ride.to.address },
            status: ride.status,
            proposedFare: ride.proposedFare,
            createdAt: ride.createdAt,
        })),
    };

    setCached(cacheKey, result);
    return result;
};

const getRiderDashboard = async (riderId: string) => {
    const cacheKey = `rider:${riderId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const [totalRides, activeRides, completedRides, cancelledRides, recentRides] = await Promise.all([
        Ride.countDocuments({ riderId }),
        Ride.countDocuments({ riderId, status: { $in: [RideStatus.PENDING, RideStatus.ACCEPTED] } }),
        Ride.countDocuments({ riderId, status: RideStatus.COMPLETED }),
        Ride.countDocuments({ riderId, status: RideStatus.CANCELLED }),
        Ride.find({ riderId })
            .populate("driverId", "name picture vehicleType averageRating")
            .sort({ createdAt: -1 })
            .limit(10)
            .select("from to status proposedFare vehicleType createdAt driverId"),
    ]);

    const result = {
        totalRidesPosted: totalRides,
        activeRides,
        completedRides,
        cancelledRides,
        recentRides: recentRides.map((ride) => {
            const rideObj: any = ride.toObject();
            return {
                _id: rideObj._id,
                from: { address: rideObj.from.address },
                to: { address: rideObj.to.address },
                status: rideObj.status,
                proposedFare: rideObj.proposedFare,
                vehicleType: rideObj.vehicleType,
                driverName: rideObj.driverId?.name || null,
                driverRating: rideObj.driverId?.averageRating || null,
                createdAt: rideObj.createdAt,
            };
        }),
    };

    setCached(cacheKey, result);
    return result;
};

const getAdminDashboard = async () => {
    const cacheKey = `admin:global`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalDrivers, totalRides, totalRevenue, newSubscriptionsThisMonth, ridesByStatus, topRatedDrivers, recentRides] = await Promise.all([
        User.countDocuments({ role: "USER", isDeleted: false }),
        User.countDocuments({ subRole: "DRIVER", isDeleted: false }),
        Ride.countDocuments({ isDeleted: false }),
        Payment.aggregate([
            { $match: { status: PaymentStatus.SUCCESS, isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.countDocuments({ status: PaymentStatus.SUCCESS, createdAt: { $gte: startOfMonth }, isDeleted: false }),
        Ride.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        User.find({ subRole: "DRIVER", isDeleted: false })
            .select("name picture averageRating totalReviews")
            .sort({ averageRating: -1 })
            .limit(5),
        Ride.find({ isDeleted: false })
            .populate("riderId", "name")
            .populate("driverId", "name")
            .sort({ createdAt: -1 })
            .limit(10)
            .select("from to status proposedFare createdAt"),
    ]);

    const ridesByStatusMap: Record<string, number> = {};
    ridesByStatus.forEach((item) => {
        ridesByStatusMap[item._id] = item.count;
    });

    const result = {
        totalUsers,
        totalDrivers,
        totalRides,
        totalRevenue: totalRevenue[0]?.total || 0,
        newSubscriptionsThisMonth,
        ridesByStatus: ridesByStatusMap,
        topRatedDrivers: topRatedDrivers.map((driver) => ({
            _id: driver._id,
            name: driver.name,
            picture: driver.picture,
            averageRating: driver.averageRating || 0,
            totalReviews: driver.totalReviews || 0,
        })),
        recentRides: recentRides.map((ride) => {
            const rideObj: any = ride.toObject();
            return {
                _id: rideObj._id,
                from: { address: rideObj.from.address },
                to: { address: rideObj.to.address },
                status: rideObj.status,
                proposedFare: rideObj.proposedFare,
                riderName: (rideObj.riderId as any)?.name || "Anonymous",
                driverName: (rideObj.driverId as any)?.name || null,
                createdAt: rideObj.createdAt,
            };
        }),
    };

    setCached(cacheKey, result);
    return result;
};

export const DashboardServices = {
    getDriverDashboard,
    getRiderDashboard,
    getAdminDashboard,
};
