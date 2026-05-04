import { model, Schema } from "mongoose";
import { IPayment, ISubscriptionPlan, PaymentMethod, PaymentStatus, PlanType } from "./subscription.interface.js";

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        name: { type: String, required: true },
        planType: { type: String, enum: Object.values(PlanType), required: true },
        price: { type: Number, required: true },
        currency: { type: String, default: "BDT" },
        durationDays: { type: Number, required: true },
        features: [{ type: String }],
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

const paymentSchema = new Schema<IPayment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        paymentId: { type: String, required: true, unique: true },
        planType: { type: String, enum: Object.values(PlanType), required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: "BDT" },
        status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
        sslcommerzTxnNo: { type: String },
        valId: { type: String },
        method: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.SSLCOMMERZ },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

export const SubscriptionPlan = model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);
export const Payment = model<IPayment>("Payment", paymentSchema);
