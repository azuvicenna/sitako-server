import crypto from "crypto";
import { Request, Response } from "express";
import svgCaptcha from "svg-captcha";
import { authenticateUser } from "@/services/auth/auth.service";
import { sendError, sendFail, sendSuccess } from "@/utils/core/handler";
import logger from "@/utils/core/logger";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

const CAPTCHA_MAX_AGE = 5 * 60 * 1000;
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000;
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || "captcha_default_secret";

const hashCaptcha = (text: string): string => {
  return crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(text.trim().toLowerCase())
    .digest("hex");
};

export const getCaptcha = (_req: Request, res: Response) => {
  try {
    const captcha = svgCaptcha.create({ size: 5, noise: 2, color: true });

    res.cookie("captcha_token", hashCaptcha(captcha.text), {
      ...COOKIE_OPTIONS,
      maxAge: CAPTCHA_MAX_AGE,
    });

    return res.type("image/svg+xml").status(200).send(captcha.data);
  } catch (error) {
    return sendError(res, error, "getCaptcha");
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password, captcha } = req.body ?? {};
    const captchaToken = req.cookies?.captcha_token;

    res.clearCookie("captcha_token", COOKIE_OPTIONS);

    if (
      !identifier ||
      !password ||
      typeof captcha !== "string" ||
      !captchaToken
    ) {
      return sendFail(res, 400, "Input tidak valid atau captcha kedaluwarsa");
    }

    if (hashCaptcha(captcha) !== captchaToken) {
      return sendFail(res, 400, "Captcha tidak valid atau kedaluwarsa");
    }

    const result = await authenticateUser(identifier, password);
    if (!result) {
      logger.warn(`Kredensial tidak valid untuk NIP/NIS: ${identifier}`);
      return sendFail(res, 401, "Kredensial tidak valid");
    }

    logger.info(`Login sukses untuk NIP/NIS: ${identifier}`);

    res.cookie("token", result.token, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_MAX_AGE,
    });

    return sendSuccess(res, { user: result.user }, "Login sukses");
  } catch (error) {
    return sendError(res, error, "login");
  }
};

export const logout = (_req: Request, res: Response) => {
  try {
    res.clearCookie("token", COOKIE_OPTIONS);
    return sendSuccess(res, null, "Logout berhasil");
  } catch (error) {
    return sendError(res, error, "logout");
  }
};
