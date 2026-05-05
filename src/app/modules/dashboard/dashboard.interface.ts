export interface IDriverDashboard {
    totalEarnings: number;
    totalRidesCompleted: number;
    averageRating: number;
    totalReviews: number;
    subscriptionStatus: {
        isSubscribed: boolean;
        expiryDate?: Date;
    };
    recentRides: any[];
}

export interface IRiderDashboard {
    totalRidesPosted: number;
    activeRides: number;
    completedRides: number;
    cancelledRides: number;
    recentRides: any[];
}

export interface IAdminDashboard {
    totalUsers: number;
    totalDrivers: number;
    totalRides: number;
    totalRevenue: number;
    newSubscriptionsThisMonth: number;
    ridesByStatus: Record<string, number>;
    topRatedDrivers: any[];
    recentRides: any[];
}
