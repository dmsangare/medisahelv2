import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "medisahel-clinique-secret-key-2026";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  clinicId: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
