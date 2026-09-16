import { Router } from 'express';

import { upload } from '@/middlewares/upload.middleware';
import { verifyAuth, verifyRole } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import {
  createLibrarianSchema,
  updateLibrarianSchema,
} from '@/validations/librarian/librarian.schema';
import {
  createLibrarian,
  deleteLibrarian,
  getLibrarianHandler,
  showLibrarian,
  updateLibrarian,
} from '@/controllers/librarian/librarian.controller';

const router: Router = Router();
const fotoUpload = upload.single('foto');

router.use(verifyAuth, verifyRole('Pustakawan'));

router.get('/', validate(paginationSchema, 'query'), getLibrarianHandler);
router.get('/:id', showLibrarian);
router.post('/', fotoUpload, validate(createLibrarianSchema), createLibrarian);
router.put('/:id', fotoUpload, validate(updateLibrarianSchema), updateLibrarian);
router.delete('/:id', deleteLibrarian);

export default router;
