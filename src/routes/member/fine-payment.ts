import { Router } from 'express';

import { verifyAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import { initiateOnlinePaymentSchema } from '@/validations/member/fine-payment.schema';
import {
  getFinePaymentsHandler,
  initiatePayment,
  showFinePayment,
} from '@/controllers/member/fine-payment.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/', validate(paginationSchema, 'query'), getFinePaymentsHandler);
router.get('/detail/:id', showFinePayment);
router.post('/pay', validate(initiateOnlinePaymentSchema), initiatePayment);

export default router;
