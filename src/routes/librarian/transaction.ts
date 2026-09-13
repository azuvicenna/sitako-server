import { Router } from "express";

import { verifyAuth } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { paginationSchema } from "@/validations/utils/pagination.schema";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/validations/librarian/transaction.schema";
import {
  createTransaction,
  deleteTransaction,
  getTransactionsHandler,
  showTransaction,
  updateTransaction,
} from "@/controllers/librarian/transaction.controller";

const router: Router = Router();

router.use(verifyAuth);

router.get("/", validate(paginationSchema, "query"), getTransactionsHandler);
router.get("/detail/:id", showTransaction);
router.post("/", validate(createTransactionSchema), createTransaction);
router.put("/:id", validate(updateTransactionSchema), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
