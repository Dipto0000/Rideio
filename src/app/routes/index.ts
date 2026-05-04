import { Router } from 'express';
import UserRoutes from '../modules/user/user.route.js';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { RideRoutes } from '../modules/ride/ride.route.js';
import { SubscriptionRoutes } from '../modules/subscription/subscription.route.js';

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
  {
    path: '/rides',
    route: RideRoutes,
  },
  {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
