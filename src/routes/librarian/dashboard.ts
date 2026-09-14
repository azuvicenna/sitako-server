import { Router } from 'express';

import { verifyAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import {
  getSummary,
  getTodayTransactions,
  getWeeklyStatistics,
} from '@/controllers/librarian/dashboard.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/summary', getSummary);
router.get('/transaction/today', validate(paginationSchema, 'query'), getTodayTransactions);
router.get('/statistics', getWeeklyStatistics);

export default router;
