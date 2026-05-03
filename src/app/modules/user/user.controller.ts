import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendResponse } from '../../utils/sendResponse.js';
import { UserServices } from './user.service.js';
import { IAuthUser } from './user.interface.js';

export const UserController = {
    registerUser: async (req: Request, res: Response, _next: NextFunction) => {
        const result = await UserServices.createUser(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    },

    getAllUsers: async (req: Request, res: Response, _next: NextFunction) => {
        const query = req.query as Record<string, string>;
        const result = await UserServices.getAllUsers(query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Users retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    },

    getSingleUser: async (req: Request, res: Response, _next: NextFunction) => {
        const id = req.params.id as string;
        const result = await UserServices.getSingleUser(id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User retrieved successfully',
            data: result.data,
        });
    },

    updateUser: async (req: Request, res: Response, _next: NextFunction) => {
        const user = req.user as IAuthUser;
        const id = req.params.id as string;
        const result = await UserServices.updateUser(
            id,
            req.body,
            user
        );

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User updated successfully',
            data: result,
        });
    },

    getMe: async (req: Request, res: Response, _next: NextFunction) => {
        const user = req.user as IAuthUser;
        const result = await UserServices.getMe(user.userId as string);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User profile retrieved successfully',
            data: result.data,
        });
    },
};