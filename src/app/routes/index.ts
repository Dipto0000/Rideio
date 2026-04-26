import { Router } from 'express';

const router = Router();

// Import module routes here as they are created:
// import AuthRoutes from '../modules/auth/auth.route.js';
// import UserRoutes from '../modules/user/user.route.js';

const moduleRoutes: Array<{ path: string; route: Router }> = [
  // Add routes here as modules are created:
  // { path: '/auth', route: AuthRoutes },
  // { path: '/user', route: UserRoutes },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;