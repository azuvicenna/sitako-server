import { Router } from "express";

import { verifyAuth } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/upload.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { paginationSchema } from "@/validations/utils/pagination.schema";
import {
  createBookSchema,
  updateBookSchema,
} from "@/validations/librarian/book.schema";
import {
  createBook,
  deleteBook,
  getBookHandler,
  showBook,
  updateBook,
} from "@/controllers/librarian/book.controller";

const router: Router = Router();

const bookUpload = upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

router.use(verifyAuth);

router.get("/", validate(paginationSchema, "query"), getBookHandler);
router.get("/detail/:id", showBook);
router.post("/", bookUpload, validate(createBookSchema), createBook);
router.put("/:id", bookUpload, validate(updateBookSchema), updateBook);
router.delete("/:id", deleteBook);

export default router;
