import jwt, {
  type JwtPayload,
  type Secret,
  type SignOptions,
} from "jsonwebtoken";

export interface UserPayload extends JwtPayload {
  id: string;
  role: string;
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const generateToken = <T extends object>(
  payload: T,
  options?: SignOptions,
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d", ...options });
};

export const verifyToken = <T = UserPayload>(token: string): T | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") return null;
    return decoded as T;
  } catch {
    return null;
  }
};
