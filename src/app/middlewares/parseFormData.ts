import { Request, Response, NextFunction } from "express";
import AppError from "../errorHelpers/AppError.js";

export const parseFormData = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body.data) {
        try {
            const parsedData = JSON.parse(req.body.data);
            delete req.body.data;
            req.body = { ...req.body, ...parsedData };
        } catch {
            throw new AppError(400, "Invalid JSON in form-data 'data' field");
        }
    }
    next();
};
