import { Types } from "mongoose";

export enum PaymentStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
    SSLCOMMERZ = "SSLCOMMERZ",
}

export enum PlanType {
    MONTHLY = "MONTHLY",
}

export interface ISubscriptionPlan {
    _id?: Types.ObjectId;
    name: string;
    planType: PlanType;
    price: number;
    currency: string;
    durationDays: number;
    features: string[];
    isActive: boolean;
    isDeleted: boolean;
}

export interface IPayment {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    paymentId: string;
    planType: PlanType;
    amount: number;
    currency: string;
    status: PaymentStatus;
    sslcommerzTxnNo?: string;
    valId?: string;
    method: PaymentMethod;
    startDate: Date;
    endDate: Date;
    isDeleted: boolean;
}

export interface ISSLCommerzInitData {
    total_amount: number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    shipping_method: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_city: string;
    cus_postcode: string;
    cus_country: string;
    cus_phone: string;
    ship_name: string;
    ship_add1: string;
    ship_city: string;
    ship_postcode: string;
    ship_country: string;
}

export interface ISSLCommerzValidationData {
    val_id: string;
    store_id: string;
    store_passwd: string;
}
