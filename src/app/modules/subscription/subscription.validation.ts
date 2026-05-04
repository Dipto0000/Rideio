import { z } from "zod/v4";

export const initPaymentValidation = z.object({
    planType: z.enum(["MONTHLY"]),
});

export const sslCallbackValidation = z.object({
    val_id: z.string().optional(),
    tran_id: z.string().optional(),
    status: z.string().optional(),
    card_type: z.string().optional(),
    store_amount: z.string().optional(),
    bank_tran_id: z.string().optional(),
    currency: z.string().optional(),
});
