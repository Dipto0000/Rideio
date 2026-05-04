import { StatusCodes } from "http-status-codes";
import SSLCommerzPayment from "sslcommerz-lts";
import { randomUUID } from "crypto";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { User } from "../user/user.model.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { Payment, SubscriptionPlan } from "./subscription.model.js";
import { ISSLCommerzInitData, PaymentStatus, PlanType } from "./subscription.interface.js";

const getSSLCommerzInstance = () => {
    return new SSLCommerzPayment(
        envVars.SSL_STORE_ID,
        envVars.SSL_STORE_PASSWORD,
        envVars.SSL_IS_SANDBOX === "true"
    );
};

const seedDefaultPlan = async () => {
    const existingPlan = await SubscriptionPlan.findOne({ planType: PlanType.MONTHLY, isDeleted: false });
    if (existingPlan) return existingPlan;

    const plan = await SubscriptionPlan.create({
        name: "Monthly Driver Subscription",
        planType: PlanType.MONTHLY,
        price: 700,
        currency: "BDT",
        durationDays: 30,
        features: ["Access to ride board", "Accept rides", "View rider contact info", "Driver notifications"],
        isActive: true,
    });

    return plan;
};

const initPayment = async (userId: string, planType: PlanType) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const plan = await SubscriptionPlan.findOne({ planType, isActive: true, isDeleted: false });
    if (!plan) {
        throw new AppError(StatusCodes.NOT_FOUND, "Subscription plan not found");
    }

    const paymentId = randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase();

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const payment = await Payment.create({
        userId: user._id,
        paymentId,
        planType: plan.planType,
        amount: plan.price,
        currency: plan.currency,
        status: PaymentStatus.PENDING,
        startDate: now,
        endDate,
    });

    const sslData: ISSLCommerzInitData = {
        total_amount: plan.price,
        currency: plan.currency,
        tran_id: paymentId,
        success_url: envVars.SSL_SUCCESS_URL,
        fail_url: envVars.SSL_FAIL_URL,
        cancel_url: envVars.SSL_CANCEL_URL,
        ipn_url: envVars.SSL_IPN_URL,
        shipping_method: "N/A",
        product_name: plan.name,
        product_category: "Subscription",
        product_profile: "general",
        cus_name: user.name,
        cus_email: user.email,
        cus_add1: user.address || "N/A",
        cus_city: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: user.phone || "01000000000",
        ship_name: user.name,
        ship_add1: user.address || "N/A",
        ship_city: "Dhaka",
        ship_postcode: "1000",
        ship_country: "Bangladesh",
    };

    const sslcz = getSSLCommerzInstance();
    const apiResponse = await sslcz.init(sslData);

    if (!apiResponse?.GatewayPageURL) {
        throw new AppError(StatusCodes.BAD_GATEWAY, "Failed to initiate payment gateway");
    }

    return {
        gatewayUrl: apiResponse.GatewayPageURL,
        paymentId: payment.paymentId,
        amount: plan.price,
        currency: plan.currency,
        sessionKey: apiResponse.sessionkey,
    };
};

const handleSuccess = async (data: Record<string, string>) => {
    const { val_id, tran_id, status } = data;

    if (!tran_id) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID is required");
    }

    const payment = await Payment.findOne({ paymentId: tran_id });
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
    }

    if (payment.status === PaymentStatus.SUCCESS) {
        return { message: "Payment already processed", payment };
    }

    if (val_id) {
        const sslcz = getSSLCommerzInstance();
        const validationResult = await sslcz.validate({
            val_id,
            store_id: envVars.SSL_STORE_ID,
            store_passwd: envVars.SSL_STORE_PASSWORD,
        });

        if (!validationResult || validationResult.status !== "VALID") {
            payment.status = PaymentStatus.FAILED;
            await payment.save();
            throw new AppError(StatusCodes.BAD_GATEWAY, "Payment validation failed");
        }

        payment.sslcommerzTxnNo = validationResult.tran_id;
        payment.valId = val_id;
    }

    payment.status = PaymentStatus.SUCCESS;
    await payment.save();

    await User.findByIdAndUpdate(payment.userId, {
        "subscription.isSubscribed": true,
        "subscription.expiryDate": payment.endDate,
    });

    return { message: "Payment successful", payment };
};

const handleCancel = async (data: Record<string, string>) => {
    const { tran_id } = data;

    if (!tran_id) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID is required");
    }

    const payment = await Payment.findOne({ paymentId: tran_id });
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
    }

    if (payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.CANCELLED;
        await payment.save();
    }

    return { message: "Payment cancelled", payment };
};

const handleFail = async (data: Record<string, string>) => {
    const { tran_id } = data;

    if (!tran_id) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID is required");
    }

    const payment = await Payment.findOne({ paymentId: tran_id });
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
    }

    if (payment.status === PaymentStatus.PENDING) {
        payment.status = PaymentStatus.FAILED;
        await payment.save();
    }

    return { message: "Payment failed", payment };
};

const handleIPN = async (data: Record<string, string>) => {
    const { tran_id, status } = data;

    if (!tran_id) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID is required");
    }

    const payment = await Payment.findOne({ paymentId: tran_id });
    if (!payment) {
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
    }

    if (payment.status !== PaymentStatus.PENDING) {
        return { message: "Payment already processed", payment };
    }

    if (status === "VALID" || status === "VALIDATED") {
        const sslcz = getSSLCommerzInstance();
        const queryResult = await sslcz.transactionQueryByTransactionId({
            tran_id,
        });

        if (queryResult?.result?.status === "VALID") {
            payment.status = PaymentStatus.SUCCESS;
            payment.sslcommerzTxnNo = queryResult.result.tran_id;
            payment.valId = queryResult.result.val_id;
            await payment.save();

            await User.findByIdAndUpdate(payment.userId, {
                "subscription.isSubscribed": true,
                "subscription.expiryDate": payment.endDate,
            });

            return { message: "IPN: Payment successful", payment };
        }
    }

    if (status === "INVALID") {
        payment.status = PaymentStatus.FAILED;
        await payment.save();
        return { message: "IPN: Payment failed", payment };
    }

    return { message: "IPN: Processing", payment };
};

const getPaymentHistory = async (userId: string, query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Payment.find({ userId, isDeleted: false }).sort({ createdAt: -1 }),
        query
    )
        .filter()
        .paginate();

    const [data, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const getSubscriptionStatus = async (userId: string) => {
    const user = await User.findById(userId).select("subscription");
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const latestPayment = await Payment.findOne({ userId, status: PaymentStatus.SUCCESS })
        .sort({ endDate: -1 });

    return {
        isSubscribed: user.subscription.isSubscribed,
        expiryDate: user.subscription.expiryDate,
        latestPayment: latestPayment || null,
    };
};

export const SubscriptionServices = {
    seedDefaultPlan,
    initPayment,
    handleSuccess,
    handleCancel,
    handleFail,
    handleIPN,
    getPaymentHistory,
    getSubscriptionStatus,
};
