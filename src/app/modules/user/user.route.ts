import { Router } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { checkAuth } from '../../middlewares/checkAuth.js';
import { UserController } from './user.controller.js';
import { Role } from './user.interface.js';

const router = Router();

router.post('/register', catchAsync(UserController.registerUser));

router.get(
    '/all-users',
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    catchAsync(UserController.getAllUsers)
);

router.get('/me', checkAuth(), catchAsync(UserController.getMe));

router.get('/:id', checkAuth(), catchAsync(UserController.getSingleUser));

router.patch('/:id', checkAuth(), catchAsync(UserController.updateUser));

export default router;