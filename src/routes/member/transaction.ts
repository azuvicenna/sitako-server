import { Router } from 'express';

import { verifyAuth, verifyRole } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import {
  createTransactionSchema,
  returnTransactionSchema,
} from '@/validations/member/transaction.schema';
import {
  createMyTransaction,
  getMyTransactions,
  returnMyTransaction,
  showMyTransaction,
} from '@/controllers/member/transaction.controller';

const router: Router = Router();

router.use(verifyAuth, verifyRole('Anggota'));

router.get('/', validate(paginationSchema, 'query'), getMyTransactions);
router.get('/detail/:id', showMyTransaction);
router.post('/', validate(createTransactionSchema), createMyTransaction);
router.post('/:id/return', validate(returnTransactionSchema), returnMyTransaction);

export default router;
