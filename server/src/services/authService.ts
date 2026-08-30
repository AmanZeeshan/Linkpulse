import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/hash.js";
import { signToken } from "../lib/jwt.js";
import { AppError, Errors } from "../lib/errors.js";

function publicUser(user: { id: string; email: string; name: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export async function register(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw Errors.conflict("EMAIL_TAKEN", "An account with that email already exists");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
  });

  return { token: signToken({ sub: user.id, email: user.email }), user: publicUser(user) };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  return { token: signToken({ sub: user.id, email: user.email }), user: publicUser(user) };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound("User");
  return publicUser(user);
}
