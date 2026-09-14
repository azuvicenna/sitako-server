import { Router } from 'express';

import { tripayWebhook } from '@/controllers/webhook/tripay.controller';

const router: Router = Router();

router.post('/', tripayWebhook);

export default router;
