import { Router } from "express";
import { verifyAuth } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { reportQuerySchema } from "@/validations/librarian/report.schema";
import {
  getCirculationReportHandler,
  getFineReportHandler,
} from "@/controllers/librarian/report.controller";

const router: Router = Router();

router.use(verifyAuth);

router.get(
  "/circulation",
  validate(reportQuerySchema, "query"),
  getCirculationReportHandler,
);

router.get(
  "/fines",
  validate(reportQuerySchema, "query"),
  getFineReportHandler,
);

export default router;
