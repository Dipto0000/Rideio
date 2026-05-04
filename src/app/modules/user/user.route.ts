import { Router } from 'express';
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
    UserController.registerUser
);

router.get(
    '/all-users',
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    UserController.getAllUsers
);

router.get('/me', checkAuth(), UserController.getMe);

router.get('/:id', checkAuth(), UserController.getSingleUser);

router.patch(
    '/:id',
    checkAuth(),
    validateRequest(updateUserValidation),
    UserController.updateUser
);

export default router;