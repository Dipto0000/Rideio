import { VehicleType } from "../modules/ride/ride.interface.js";

// Haversine formula: Calculates straight-line distance between two coordinates (in km)
export const getDistanceInKm = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Fare calculation (System suggests)
// Bike: 50 BDT base + 15 BDT/km
// Car: 100 BDT base + 50 BDT/km
export const calculateSuggestedFare = (
    distanceInKm: number,
    vehicleType: VehicleType
): number => {
    const BASE_FARE = vehicleType === VehicleType.BIKE ? 50 : 100;
    const RATE_PER_KM = vehicleType === VehicleType.BIKE ? 15 : 50;
    return Math.round(BASE_FARE + distanceInKm * RATE_PER_KM);
};
