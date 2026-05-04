import { Router } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { parseFormData } from '../../middlewares/parseFormData.js';
import { multerUpload } from '../../config/multer.config.js';
import { UserController } from './user.controller.js';
import { Role } from './user.interface.js';
import { createUserValidation, updateUserValidation } from './user.validation.js';

const router = Router();

router.post(
    '/register',
    parseFormData,
    multerUpload.single('profilePicture'),
    validateRequest(createUserValidation),
    catchAsync(UserController.registerUser)
);

router.get(
    '/all-users',
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    catchAsync(UserController.getAllUsers)
);

router.get('/me', checkAuth(), catchAsync(UserController.getMe));

router.get('/:id', checkAuth(), catchAsync(UserController.getSingleUser));

router.patch(
    '/:id',
    checkAuth(),
    validateRequest(updateUserValidation),
    catchAsync(UserController.updateUser)
);

export default router;