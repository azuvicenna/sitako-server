import { Router } from "express";

import { verifyAuth } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { loginSchema } from "@/validations/auth/auth.schema";
import { getCaptcha, login, logout } from "@/controllers/auth/auth.controller";

const router: Router = Router();

router.get("/captcha", getCaptcha);
router.post("/login", validate(loginSchema), login);
router.post("/logout", verifyAuth, logout);

export default router;
