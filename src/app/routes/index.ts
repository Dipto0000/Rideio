import { Router } from 'express';
import UserRoutes from '../modules/user/user.route.js';
import { AuthRoutes } from '../modules/auth/auth.route.js';

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
