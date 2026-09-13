import { Router } from "express";

import { verifyAuth } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { createBookmarkSchema } from "@/validations/member/bookmark.schema";
import {
  createBookmark,
  deleteBookmark,
  readDigitalBook,
  showBook,
} from "@/controllers/member/library.controller";

const router: Router = Router();

router.use(verifyAuth);

router.get("/detail/:id", showBook);
router.get("/digital/read/:id", readDigitalBook);
router.post("/bookmark/:id", validate(createBookmarkSchema), createBookmark);
router.delete("/bookmark/delete/:bookmarkId", deleteBookmark);

export default router;
