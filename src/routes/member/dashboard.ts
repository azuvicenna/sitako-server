import { Router } from 'express';
import { verifyAuth } from '@/middlewares/auth.middleware';
import { getMemberDashboard } from '@/controllers/member/dashboard.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/', getMemberDashboard);

export default router;
