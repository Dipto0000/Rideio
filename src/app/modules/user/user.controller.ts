import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { UserServices } from './user.service.js';
import { IAuthUser } from './user.interface.js';
import AppError from '../../errorHelpers/AppError.js';

type UploadedFile = Express.Multer.File & { secure_url?: string };

function getFileUrl(file: Express.Multer.File | undefined): string | undefined {
  if (!file) return undefined;
  const uploaded = file as UploadedFile;
  return uploaded.path || uploaded.secure_url;
}

export const UserController = {
    registerUser: catchAsync(async (req: Request, res: Response) => {
        const picture = getFileUrl(req.file);
        const result = await UserServices.createUser({ ...req.body, picture });

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    }),

    getAllUsers: catchAsync(async (req: Request, res: Response) => {
        const query = req.query as Record<string, string>;
        const result = await UserServices.getAllUsers(query);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Users retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    }),

    getSingleUser: catchAsync(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await UserServices.getSingleUser(id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User retrieved successfully',
            data: result.data,
        });
    }),

    updateUser: catchAsync(async (req: Request, res: Response) => {
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
    }),

    getMe: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        const result = await UserServices.getMe(user.userId as string);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'User profile retrieved successfully',
            data: result.data,
        });
    }),

    uploadProfilePhoto: catchAsync(async (req: Request, res: Response) => {
        const user = req.user as IAuthUser;
        if (!req.file) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'No file uploaded');
        }
        const pictureUrl = getFileUrl(req.file) || '';

        await UserServices.updateUser(user.userId, {
            picture: pictureUrl,
        } as Record<string, unknown>, user);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Profile photo updated successfully',
            data: { picture: pictureUrl },
        });
    }),
};