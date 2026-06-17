import { StatusCodes } from "http-status-codes";
import SSLCommerzPayment from "sslcommerz-lts";
import { randomUUID, createHash } from "crypto";
import { envVars } from "../../config/env.js";
import AppError from "../../errorHelpers/AppError.js";
import { User } from "../user/user.model.js";
import { QueryBuilder } from "../../utils/QueryBuilder.js";
import { Payment, SubscriptionPlan } from "./subscription.model.js";
import { ISSLCommerzInitData, PaymentStatus, PlanType } from "./subscription.interface.js";

// Demo user IDs & profiles — mirrors auth.demo-service.ts
const DEMO_USER_IDS = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
    '000000000000000000000004',
];

const DEMO_USER_PROFILES: Record<string, { name: string; email: string; phone: string; address: string }> = {
    '000000000000000000000001': { name: 'Super Admin', email: 'superadmin@rideio.demo', phone: '01000000000', address: 'Dhaka' },
    '000000000000000000000002': { name: 'Admin User', email: 'admin@rideio.demo', phone: '01000000000', address: 'Dhaka' },
    '000000000000000000000003': { name: 'Demo Rider', email: 'demo.rider@rideio.demo', phone: '01000000000', address: 'Dhaka' },
    '000000000000000000000004': { name: 'Demo Driver', email: 'demo.driver@rideio.demo', phone: '01000000000', address: 'Dhaka' },
};

const getSSLCommerzInstance = () => {
    return new SSLCommerzPayment(
        envVars.SSL_STORE_ID,
        envVars.SSL_STORE_PASSWORD,
        envVars.SSL_IS_SANDBOX !== "true"
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
    let userName: string, userEmail: string, userPhone: string, userAddress: string;
    let userDocId: string;

    if (DEMO_USER_IDS.includes(userId)) {
        const profile = DEMO_USER_PROFILES[userId];
        if (!profile) {
            throw new AppError(StatusCodes.NOT_FOUND, "Demo user profile not found");
        }
        userDocId = userId;
        userName = profile.name;
        userEmail = profile.email;
        userPhone = profile.phone;
        userAddress = profile.address;
    } else {
        const dbUser = await User.findById(userId);
        if (!dbUser) {
            throw new AppError(StatusCodes.NOT_FOUND, "User not found");
        }
        userDocId = dbUser._id.toString();
        userName = dbUser.name;
        userEmail = dbUser.email;
        userPhone = dbUser.phone || "01000000000";
        userAddress = dbUser.address || "N/A";
    }

    const plan = await SubscriptionPlan.findOne({ planType, isActive: true, isDeleted: false });
    if (!plan) {
        throw new AppError(StatusCodes.NOT_FOUND, "Subscription plan not found");
    }

    const existingPending = await Payment.findOne({
        userId: userDocId,
        planType,
        status: PaymentStatus.PENDING,
    });
    if (existingPending) {
        throw new AppError(StatusCodes.BAD_REQUEST,
            "You already have a pending payment. Complete or cancel it first."
        );
    }

    const paymentId = randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase();

    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const payment = await Payment.create({
        userId: userDocId,
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
        cus_name: userName,
        cus_email: userEmail,
        cus_add1: userAddress,
        cus_city: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: userPhone,
        ship_name: userName,
        ship_add1: userAddress,
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

// Add IPN signature verification utility
const verifySSLCommerzIPN = (ipnData: Record<string, string>): boolean => {
    // Extract the hash from IPN data
    const receivedHash = ipnData.hash || ipnData.verify_sign;
    if (!receivedHash) {
        return false;
    }

    // Create verification string according to SSLCommerz specification
    // Parameters to include (in alphabetical order):
    // amount, bank_tran_id, currency, currency_amount, currency_rate,
    // cust_addr, cust_city, cust_country, cust_email, cust_name,
    // cust_state, cust_postcode, cust_tel, cust_txn_id, discount_amount,
    // dtm, fld1-fld10, inv2, inv3, merchant_id, merchant_serial,
    // order_id, payment_mode, ship_addr, ship_city, ship_country,
    // ship_name, ship_postcode, ship_state, ship_tel, store_id,
    // value_a-value_d, verify_key, verify_sign
    
    // For simplicity and based on common SSLCommerz IPN structure,
    // we'll use the verify_key parameter which tells us which fields to include
    const verifyKey = ipnData.verify_key;
    if (!verifyKey) {
        // Fallback: use common parameters if verify_key not provided
        const verificationString =
            `store_id=${envVars.SSL_STORE_ID}` +
            `&store_passwd=${envVars.SSL_STORE_PASSWORD}` +
            `&tran_id=${ipnData.tran_id || ''}` +
            `&amount=${ipnData.amount || ''}` +
            `&currency=${ipnData.currency || ''}` +
            `&bank_tran_id=${ipnData.bank_tran_id || ''}` +
            `&currency_amount=${ipnData.currency_amount || ''}` +
            `&currency_rate=${ipnData.currency_rate || ''}` +
            `&discount_amount=${ipnData.discount_amount || ''}` +
            `&value_a=${ipnData.value_a || ''}` +
            `&value_b=${ipnData.value_b || ''}` +
            `&value_c=${ipnData.value_c || ''}` +
            `&value_d=${ipnData.value_d || ''}` +
            `&card_no=${ipnData.card_no || ''}` +
            `&card_issuer=${ipnData.card_issuer || ''}` +
            `&card_brand=${ipnData.card_brand || ''}` +
            `&card_issuer_country=${ipnData.card_issuer_country || ''}` +
            `&card_issuer_country_code=${ipnData.card_issuer_country_code || ''}` +
            `&verify_sign=${ipnData.verify_sign || ''}` +
            `&verify_key=${ipnData.verify_key || ''}` +
            `&status=${ipnData.status || ''}` +
            `&tran_date=${ipnData.tran_date || ''}` +
            `&val_id=${ipnData.val_id || ''}` +
            `&store_amount=${ipnData.store_amount || ''}` +
            `&card_type=${ipnData.card_type || ''}` +
            `&risk_level=${ipnData.risk_level || ''}` +
            `&risk_title=${ipnData.risk_title || ''}` +
            `&risk_score=${ipnData.risk_score || ''}`;
        
        // Create MD5 hash
        const hash = createHash('md5').update(verificationString).digest('hex');
        return hash.toLowerCase() === receivedHash.toLowerCase();
    }

    // If verify_key is provided, parse it and use only those parameters
    const keys = verifyKey.split(',').map(key => key.trim());
    let verificationString = `store_id=${envVars.SSL_STORE_ID}`;
    
    // Add store password
    verificationString += `&store_passwd=${envVars.SSL_STORE_PASSWORD}`;
    
    // Add parameters in alphabetical order as specified by verify_key
    const sortedKeys = [...keys].sort();
    for (const key of sortedKeys) {
        if (ipnData[key] !== undefined && ipnData[key] !== null) {
            verificationString += `&${key}=${ipnData[key]}`;
        }
    }
    
    // Create MD5 hash
    const hash = createHash('md5').update(verificationString).digest('hex');
    return hash.toLowerCase() === receivedHash.toLowerCase();
};

const handleIPN = async (data: Record<string, string>) => {
    // VERIFY IPN SIGNATURE FIRST
    if (!verifySSLCommerzIPN(data)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid IPN signature");
    }

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
    // Handle demo users — derive subscription status from actual Payment records
    if (DEMO_USER_IDS.includes(userId)) {
        const latestPayment = await Payment.findOne({ userId, status: PaymentStatus.SUCCESS })
            .sort({ endDate: -1 });
        return {
            isSubscribed: !!latestPayment,
            expiryDate: latestPayment?.endDate || null,
            latestPayment: latestPayment || null,
        };
    }

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

const cancelPendingPayment = async (userId: string) => {
    const pendingPayment = await Payment.findOne({
        userId,
        status: PaymentStatus.PENDING,
    });

    if (!pendingPayment) {
        throw new AppError(StatusCodes.NOT_FOUND, "No pending payment found");
    }

    pendingPayment.status = PaymentStatus.CANCELLED;
    await pendingPayment.save();

    return { message: "Pending payment cancelled", paymentId: pendingPayment.paymentId };
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
    cancelPendingPayment,
};
