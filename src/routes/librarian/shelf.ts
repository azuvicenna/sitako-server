import { Router } from 'express';

import { verifyAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import { createShelfSchema, updateShelfSchema } from '@/validations/librarian/shelf.schema';
import { createStackSchema, updateStackSchema } from '@/validations/librarian/stack.schema';
import {
  createShelf,
  deleteShelf,
  getShelvesHandler,
  showShelf,
  updateShelf,
} from '@/controllers/librarian/shelf.controller';
import {
  createStack,
  deleteStack,
  getStacksHandler,
  showStack,
  updateStack,
} from '@/controllers/librarian/stack.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/', validate(paginationSchema, 'query'), getShelvesHandler);
router.get('/detail/:id', showShelf);
router.post('/', validate(createShelfSchema), createShelf);
router.put('/:id', validate(updateShelfSchema), updateShelf);
router.delete('/:id', deleteShelf);

router.get('/:shelfId/stacks', validate(paginationSchema, 'query'), getStacksHandler);
router.get('/:shelfId/stacks/detail/:id', showStack);
router.post('/:shelfId/stacks', validate(createStackSchema), createStack);
router.put('/:shelfId/stacks/:id', validate(updateStackSchema), updateStack);
router.delete('/:shelfId/stacks/:id', deleteStack);

export default router;
