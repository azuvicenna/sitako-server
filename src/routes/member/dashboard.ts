import { Router } from 'express';
import { verifyAuth, verifyRole } from '@/middlewares/auth.middleware';
import { getMemberDashboard } from '@/controllers/member/dashboard.controller';

const router: Router = Router();

router.use(verifyAuth, verifyRole('Anggota'));

router.get('/', getMemberDashboard);

export default router;
