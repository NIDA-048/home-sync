import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not configured in .env");
}

const secretKey = new TextEncoder().encode(secret);

export type AuthUser = {
  userId: string;
  email: string;
};

export async function createAuthToken(user: AuthUser) {
  return await new SignJWT({
    userId: user.userId,
    email: user.email,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAuthToken(
  token: string
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}