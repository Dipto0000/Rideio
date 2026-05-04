import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { getDistanceInKm, calculateSuggestedFare } from "../../utils/distance.js";
import { RideStatus, VehicleType } from "./ride.interface.js";
import { IRide } from "./ride.interface.js";
import { Ride } from "./ride.model.js";

const createRide = async (payload: Partial<IRide>, riderId: string) => {
    // Calculate distance using Haversine (from frontend coordinates)
    const distanceInKm = getDistanceInKm(
        payload.from!.lat,
        payload.from!.lng,
        payload.to!.lat,
        payload.to!.lng
    );

    // Calculate system suggested fare based on vehicle type
    const systemSuggestedFare = calculateSuggestedFare(
        distanceInKm,
        payload.vehicleType!
    );

    const ride = await Ride.create({
        ...payload,
        riderId,
        distanceInKm,
        systemSuggestedFare,
        status: RideStatus.PENDING,
    });

    return ride;
};

const getAllRides = async (query: Record<string, string>) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Only show PENDING rides in public listing
    const rides = await Ride.find({ status: RideStatus.PENDING })
        .populate("riderId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("from to arrivalTime status proposedFare vehicleType riderId");

    const total = await Ride.countDocuments({ status: RideStatus.PENDING });

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

const getRideById = async (id: string, userId: string) => {
    const ride = await Ride.findById(id)
        .populate("riderId", "name phone picture")
        .populate("driverId", "name phone picture vehicleType numberplate");

    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    // If ride is accepted, show full details to involved parties
    if (
        ride.status === RideStatus.ACCEPTED ||
        ride.status === RideStatus.IN_PROGRESS ||
        ride.status === RideStatus.COMPLETED
    ) {
        const riderIdStr = (ride.riderId as any)._id?.toString();
        const driverIdStr = ride.driverId?.toString();

        if (userId === riderIdStr || userId === driverIdStr) {
            return ride;
        }
    }

    // For non-involved users, return limited info (public view)
    return {
        riderName: (ride.riderId as any).name,
        from: { address: ride.from.address },
        to: { address: ride.to.address },
        arrivalTime: ride.arrivalTime,
        status: ride.status,
        proposedFare: ride.proposedFare,
        vehicleType: ride.vehicleType,
    };
};

const acceptRide = async (rideId: string, driverId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.status !== RideStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Ride is already ${ride.status}`
        );
    }

    ride.status = RideStatus.ACCEPTED;
    ride.driverId = new Types.ObjectId(driverId);
    await ride.save();

    // Send notification to rider
    const User = (await import("../user/user.model.js")).User;
    await User.findByIdAndUpdate(ride.riderId, {
        $push: {
            notifications: {
                message: `Your ride has been accepted by a driver`,
                rideId: ride._id,
                type: "RIDE_ACCEPTED",
                isRead: false,
                createdAt: new Date(),
            },
        },
    });

    return ride;
};

const cancelRide = async (rideId: string, riderId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.riderId.toString() !== riderId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the rider can cancel this ride"
        );
    }

    if (ride.status !== RideStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Ride can only be cancelled when pending"
        );
    }

    ride.status = RideStatus.CANCELLED;
    await ride.save();

    // Send notification to driver if accepted
    if (ride.driverId) {
        const User = (await import("../user/user.model.js")).User;
        await User.findByIdAndUpdate(ride.driverId, {
            $push: {
                notifications: {
                    message: `Rider has cancelled the ride`,
                    rideId: ride._id,
                    type: "RIDE_CANCELLED",
                    isRead: false,
                    createdAt: new Date(),
                },
            },
        });
    }

    return { message: "Ride cancelled successfully" };
};

const startRide = async (rideId: string, driverId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.driverId?.toString() !== driverId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the assigned driver can start this ride"
        );
    }

    if (ride.status !== RideStatus.ACCEPTED) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Ride must be accepted before starting"
        );
    }

    ride.status = RideStatus.IN_PROGRESS;
    await ride.save();

    return ride;
};

const completeRide = async (rideId: string, driverId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.driverId?.toString() !== driverId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Only the assigned driver can complete this ride"
        );
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Ride must be in progress before completing"
        );
    }

    ride.status = RideStatus.COMPLETED;
    await ride.save();

    return ride;
};

const getMyRides = async (userId: string, query: Record<string, string>) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const rides = await Ride.find({
        $or: [{ riderId: userId }, { driverId: userId }],
    })
        .populate("riderId", "name picture")
        .populate("driverId", "name picture vehicleType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Ride.countDocuments({
        $or: [{ riderId: userId }, { driverId: userId }],
    });

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

const getDriverNotifications = async (
    driverId: string,
    query: Record<string, string>
) => {
    const User = (await import("../user/user.model.js")).User;
    const user = await User.findById(driverId).select("notifications");

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const notifications = user.notifications
        .sort(
            (a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(skip, skip + limit);

    const total = user.notifications.length;

    return {
        data: notifications,
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
    getDriverNotifications,
};
