import { model, Schema } from "mongoose";
import { DeletedModelType, ISoftDeletedRecord } from "./admin.interface.js";

const softDeletedRecordSchema = new Schema<ISoftDeletedRecord>(
    {
        originalModel: { type: String, enum: Object.values(DeletedModelType), required: true },
        originalId: { type: String, required: true },
        deletedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        deletedAt: { type: Date, default: Date.now },
        reason: { type: String },
    },
    { timestamps: true, versionKey: false }
);

export const SoftDeletedRecord = model<ISoftDeletedRecord>("SoftDeletedRecord", softDeletedRecordSchema);
