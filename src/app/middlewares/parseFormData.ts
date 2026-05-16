import { Request, Response, NextFunction } from "express";
import AppError from "../errorHelpers/AppError.js";

export const parseFormData = (req: Request, _res: Response, next: NextFunction) => {
    // req.body may be undefined before Multer parses multipart/form-data
    if (req.body && req.body.data) {
        try {
            const parsedData = JSON.parse(req.body.data);
            delete req.body.data;
            req.body = { ...req.body, ...parsedData };
        } catch {
            throw new AppError(400, "Invalid request format. Please try again.");
        }
    }
    next();
};
