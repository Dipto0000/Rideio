import { Response } from 'express';
import { TErrorSources } from '../interfaces/error.types.js';

export interface TMeta {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
}

export interface TResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    meta?: TMeta;
    errorSources?: TErrorSources[];
}

export const sendResponse = <T>(res: Response, data: TResponse<T>) => {
    res.status(data.statusCode).json({
        statusCode: data.statusCode,
        success: data.success,
        message: data.message,
        meta: data.meta,
        data: data.data,
        ...(data.errorSources && { errorSources: data.errorSources }),
    });
};