import { Router } from 'express';

import { verifyAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import { createFineSchema, updateFineSchema } from '@/validations/librarian/fine.schema';
import {
  createFine,
  deleteFine,
  getFinesHandler,
  showFine,
  updateFine,
} from '@/controllers/librarian/fine.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/', validate(paginationSchema, 'query'), getFinesHandler);
router.get('/detail/:id', showFine);
router.post('/', validate(createFineSchema), createFine);
router.put('/:id', validate(updateFineSchema), updateFine);
router.delete('/:id', deleteFine);

export default router;
