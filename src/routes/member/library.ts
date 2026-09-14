import { Router } from 'express';

import { verifyAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import { createBookmarkSchema } from '@/validations/member/bookmark.schema';
import {
  createBookmark,
  deleteBookmark,
  getAvailableBooks,
  getMyBookmarks,
  readDigitalBook,
  showBook,
} from '@/controllers/member/library.controller';

const router: Router = Router();

router.use(verifyAuth);

router.get('/', validate(paginationSchema, 'query'), getAvailableBooks);
router.get('/bookmark', validate(paginationSchema, 'query'), getMyBookmarks);
router.get('/detail/:id', showBook);
router.get('/digital/read/:id', readDigitalBook);
router.post('/bookmark/:id', validate(createBookmarkSchema), createBookmark);
router.delete('/bookmark/delete/:bookmarkId', deleteBookmark);

export default router;
