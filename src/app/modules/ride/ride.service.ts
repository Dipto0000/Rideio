import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import { Ride } from "./ride.model.js";
import { User } from "../user/user.model.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { clearDashboardCache } from "../dashboard/dashboard.service.js";
import { RideStatus, VehicleType } from "./ride.interface.js";
import { getDistanceInKm, calculateSuggestedFare } from "../../utils/distance.js";

const createRide = async (payload: Record<string, unknown>, userId: string) => {
    const { from, to, phone, vehicleType } = payload as {
        from: { lat: number; lng: number };
        to: { lat: number; lng: number };
        phone?: string;
        vehicleType: VehicleType;
    };

    const distanceInKm = getDistanceInKm(from.lat, from.lng, to.lat, to.lng);
    const systemSuggestedFare = calculateSuggestedFare(distanceInKm, vehicleType);

    const ride = await Ride.create({
        ...payload,
        riderId: userId,
        distanceInKm: parseFloat(distanceInKm.toFixed(2)),
        systemSuggestedFare: parseFloat(systemSuggestedFare.toFixed(2)),
    });

    clearDashboardCache(userId);
    return ride;
};

const getAllRides = async (query: Record<string, unknown>) => {
    const rideQuery = new QueryBuilder(
        Ride.find({ status: "PENDING" }).populate("riderId", "name picture"),
        query
    )
        .search(["from.address", "to.address"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const [data, meta] = await Promise.all([
        rideQuery.modelQuery,
        rideQuery.countTotal(),
    ]);

    return { data, meta };
};

const getRideById = async (id: string, userId?: string) => {
    const ride = await Ride.findById(id)
        .populate("riderId", "name picture phone")
        .populate(
            "driverId",
            "name picture phone numberplate vehicleType averageRating totalReviews"
        );

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    // If there's an authenticated user, check if they're the rider or driver
    if (userId) {
        const isRider = ride.riderId?._id?.toString() === userId;
        const isDriver = ride.driverId?._id?.toString() === userId;
        if (!isRider && !isDriver) {
            // Non-participants (e.g. driver browsing): show rider name + picture, hide phone
            const rider = ride.riderId as unknown as { _id: unknown; name: string; picture?: string };
            if (rider && rider._id) {
                ride.riderId = {
                    _id: rider._id,
                    name: rider.name,
                    picture: rider.picture,
                } as unknown as typeof ride.riderId;
            }
            // Always hide driver info from non-participants
            ride.driverId = undefined as unknown as typeof ride.driverId;
        }
    } else {
        // Unauthenticated users see only basic info
        ride.riderId = undefined as unknown as typeof ride.riderId;
        ride.driverId = undefined as unknown as typeof ride.driverId;
    }

    return ride;
};

const acceptRide = async (rideId: string, driverId: string) => {
    // Check if driver already has an active ride
    const activeRide = await Ride.findOne({
        driverId,
        status: { $in: [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
    });

    if (activeRide) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Complete your current ride before accepting a new one"
        );
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.status !== "PENDING") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Ride is not available");
    }

    ride.driverId = driverId as unknown as typeof ride.driverId;
    ride.status = RideStatus.ACCEPTED;
    await ride.save();

    // Notify rider that their ride has been accepted
    const { NotificationServices } = await import(
        "../notification/notification.service.js"
    );
    await NotificationServices.pushNotification(
        ride.riderId.toString(),
        {
            message: `Your ride has been accepted by a driver`,
            type: "RIDE_ACCEPTED",
            rideId: ride._id.toString(),
        }
    );

    clearDashboardCache(ride.riderId?.toString());
    clearDashboardCache(driverId);
    return ride;
};

const cancelRide = async (rideId: string, userId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    const isRider = ride.riderId.toString() === userId;
    const isDriver = ride.driverId?.toString() === userId;

    if (!isRider && !isDriver) {
        throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }

    // Cannot cancel completed or already-cancelled rides
    if (
        ride.status === RideStatus.COMPLETED ||
        ride.status === RideStatus.CANCELLED
    ) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Ride cannot be cancelled"
        );
    }

    // Driver: never allowed to cancel once they've accepted
    if (isDriver) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Driver cannot cancel a ride once accepted"
        );
    }

    // Rider: cannot cancel mid-travel
    if (isRider && ride.status === RideStatus.IN_PROGRESS) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Cannot cancel a ride that is already in progress"
        );
    }

    ride.status = RideStatus.CANCELLED;
    await ride.save();
    clearDashboardCache(ride.riderId?.toString());
    clearDashboardCache(ride.driverId?.toString());

    // Notify driver that the rider cancelled
    if (ride.driverId) {
        const { NotificationServices } = await import(
            "../notification/notification.service.js"
        );
        await NotificationServices.pushNotification(
            ride.driverId.toString(),
            {
                message: `Rider has cancelled the ride`,
                type: "RIDE_CANCELLED",
                rideId: ride._id.toString(),
            }
        );
    }

    return ride;
};

const startRide = async (rideId: string, driverId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.status !== "ACCEPTED") {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Ride must be accepted before starting"
        );
    }

    if (ride.driverId?.toString() !== driverId) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "You are not the assigned driver"
        );
    }

    ride.status = RideStatus.IN_PROGRESS;
    await ride.save();
    clearDashboardCache(ride.riderId?.toString());
    clearDashboardCache(driverId);

    // Notify rider that ride has started
    const { NotificationServices } = await import(
        "../notification/notification.service.js"
    );
    await NotificationServices.pushNotification(
        ride.riderId.toString(),
        {
            message: `Your ride has started`,
            type: "RIDE_STARTED",
            rideId: ride._id.toString(),
        }
    );

    return ride;
};

const completeRide = async (rideId: string, driverId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.status !== "IN_PROGRESS") {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Ride must be in progress before completing"
        );
    }

    if (ride.driverId?.toString() !== driverId) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "You are not the assigned driver"
        );
    }

    ride.status = RideStatus.COMPLETED;
    await ride.save();
    clearDashboardCache(ride.riderId?.toString());
    clearDashboardCache(driverId);

    // Notify rider that ride is completed
    const { NotificationServices } = await import(
        "../notification/notification.service.js"
    );
    await NotificationServices.pushNotification(
        ride.riderId.toString(),
        {
            message: `Your ride has been completed`,
            type: "RIDE_COMPLETED",
            rideId: ride._id.toString(),
        }
    );

    return ride;
};

const getMyRides = async (
    userId: string,
    query: Record<string, string>,
    role: "RIDER" | "DRIVER"
) => {
    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "10")));
    const skip = (page - 1) * limit;

    const filterField = role === "RIDER" ? "riderId" : "driverId";

    const [rides, total] = await Promise.all([
        Ride.find({ [filterField]: userId })
            .populate("riderId", "name picture phone")
            .populate(
                "driverId",
                "name picture phone numberplate vehicleType averageRating totalReviews"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Ride.countDocuments({ [filterField]: userId }),
    ]);

    return {
        data: rides,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
    };
};

export const RideServices = {
    createRide,
    getAllRides,
    getRideById,
    acceptRide,
    cancelRide,
    startRide,
    completeRide,
    getMyRides,
};
