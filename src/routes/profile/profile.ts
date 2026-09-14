import { Router } from 'express';

import { verifyAuth } from '@/middlewares/auth.middleware';
import { getMyProfile, updateMyProfile } from '@/controllers/profile/profile.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
