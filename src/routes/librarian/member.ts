import { Router } from 'express';

import { upload } from '@/middlewares/upload.middleware';
import { verifyAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { paginationSchema } from '@/validations/utils/pagination.schema';
import { createMemberSchema, updateMemberSchema } from '@/validations/librarian/member.schema';
import {
  createMember,
  deleteMember,
  getMemberHandler,
  showMember,
  updateMember,
} from '@/controllers/librarian/member.controller';

const router: Router = Router();
const fotoUpload = upload.single('foto');

router.use(verifyAuth);

router.get('/', validate(paginationSchema, 'query'), getMemberHandler);
router.get('/:id', showMember);
router.post('/', fotoUpload, validate(createMemberSchema), createMember);
router.put('/:id', fotoUpload, validate(updateMemberSchema), updateMember);
router.delete('/:id', deleteMember);

export default router;
