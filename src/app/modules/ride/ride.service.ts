import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { getDistanceInKm, calculateSuggestedFare } from "../../utils/distance.js";
import { RideStatus, VehicleType } from "./ride.interface.js";
import { IRide } from "./ride.interface.js";
import { Ride } from "./ride.model.js";

const createRide = async (payload: Partial<IRide>, riderId: string) => {
    const distanceInKm = getDistanceInKm(
        payload.from!.lat,
        payload.from!.lng,
        payload.to!.lat,
        payload.to!.lng
    );

    const systemSuggestedFare = calculateSuggestedFare(
        distanceInKm,
        payload.vehicleType!
    );

    const proposedFare = payload.proposedFare || systemSuggestedFare;

    const ride = await Ride.create({
        ...payload,
        riderId,
        distanceInKm,
        systemSuggestedFare,
        proposedFare,
        status: RideStatus.PENDING,
    });

    return ride;
};

const getAllRides = async (query: Record<string, string>) => {
    const q = { ...query };
    delete q.status;

    if (q.minFare || q.maxFare) {
        const fareFilter: Record<string, number> = {};
        if (q.minFare) fareFilter.$gte = Number(q.minFare);
        if (q.maxFare) fareFilter.$lte = Number(q.maxFare);
        q.proposedFare = fareFilter as any;
    }
    delete q.minFare;
    delete q.maxFare;

    const queryBuilder = new QueryBuilder(
        Ride.find({ status: RideStatus.PENDING }).populate("riderId", "name"),
        q
    );

    const rides = await queryBuilder
        .search(["from.address", "to.address"])
        .filter()
        .sort()
        .paginate()
        .build();

    const sanitizedRides = rides.map((ride) => {
        const rideObj = ride.toObject();
        return {
            _id: rideObj._id,
            riderId: { name: (rideObj.riderId as any)?.name || "Anonymous" },
            from: { address: rideObj.from.address },
            to: { address: rideObj.to.address },
            arrivalTime: rideObj.arrivalTime,
            status: rideObj.status,
            proposedFare: rideObj.proposedFare,
            vehicleType: rideObj.vehicleType,
            distanceInKm: rideObj.distanceInKm,
            systemSuggestedFare: rideObj.systemSuggestedFare,
        };
    });

    const meta = await queryBuilder.countTotal();

    return { data: sanitizedRides, meta };
};

const getRideById = async (id: string, userId: string) => {
    const ride = await Ride.findById(id)
        .populate("riderId", "name phone picture")
        .populate("driverId", "name phone picture vehicleType numberplate");

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

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

    return {
        _id: ride._id,
        riderId: { name: (ride.riderId as any).name || "Anonymous" },
        from: { address: ride.from.address },
        to: { address: ride.to.address },
        arrivalTime: ride.arrivalTime,
        status: ride.status,
        proposedFare: ride.proposedFare,
        vehicleType: ride.vehicleType,
        distanceInKm: ride.distanceInKm,
        systemSuggestedFare: ride.systemSuggestedFare,
    };
};

const acceptRide = async (rideId: string, driverId: string) => {
    const ride = await Ride.findById(rideId);

    if (!ride) {
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.status !== RideStatus.PENDING) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Ride is already ${ride.status}`
        );
    }

    ride.status = RideStatus.ACCEPTED;
    ride.driverId = new Types.ObjectId(driverId);
    await ride.save();

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
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.riderId.toString() !== riderId) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Only the rider can cancel this ride"
        );
    }

    if (ride.status !== RideStatus.PENDING && ride.status !== RideStatus.ACCEPTED) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Ride can only be cancelled before it starts"
        );
    }

    ride.status = RideStatus.CANCELLED;
    await ride.save();

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
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.driverId?.toString() !== driverId) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Only the assigned driver can start this ride"
        );
    }

    if (ride.status !== RideStatus.ACCEPTED) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
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
        throw new AppError(StatusCodes.NOT_FOUND, "Ride not found");
    }

    if (ride.driverId?.toString() !== driverId) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Only the assigned driver can complete this ride"
        );
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Ride must be in progress before completing"
        );
    }

    ride.status = RideStatus.COMPLETED;
    await ride.save();

    return ride;
};

const getMyRides = async (userId: string, query: Record<string, string>) => {
    const q = { ...query };
    delete q.status;

    const queryBuilder = new QueryBuilder(
        Ride.find({
            $or: [{ riderId: userId }, { driverId: userId }],
        })
            .populate("riderId", "name picture")
            .populate("driverId", "name picture vehicleType"),
        q
    );

    const rides = await queryBuilder
        .search(["from.address", "to.address"])
        .filter()
        .sort()
        .paginate()
        .build();

    const meta = await queryBuilder.countTotal();

    return { data: rides, meta };
};

const getDriverNotifications = async (
    driverId: string,
    query: Record<string, string>
) => {
    const User = (await import("../user/user.model.js")).User;
    const user = await User.findById(driverId).select("notifications");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
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
