/**
 * Auth Controller — Exhaustive Test Suite
 *
 * Strategy: supertest against a minimal Express app so every test exercises
 * the full middleware chain (Zod validation → controller handler → response).
 * All external I/O is mocked via vi.mock at the service layer, NOT the DB layer.
 *
 * Coverage target: 100% branch coverage across register, login, verify-email,
 * resend-verification, logout, GET /user, and GET /config.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// ─── Mock: bypass rate-limiter so tests don't get 429'd ──────────────────────
vi.mock("../../config/rate-limit.js", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  globalLimiter: (_req: any, _res: any, next: any) => next(),
}));

// ─── Mock: authService ────────────────────────────────────────────────────────
// vi.mock is hoisted to the top of the file by Vitest, so any variables
// referenced inside the factory must also be hoisted via vi.hoisted().
const mockAuthService = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  registerUser: vi.fn(),
  verifyPassword: vi.fn(),
  createNewVerificationToken: vi.fn(),
  verifyUserEmail: vi.fn(),
}));

vi.mock("../../../infrastructure/di/container.js", () => ({
  authService: mockAuthService,
  // uow is only used by setupGooglePassport, not the handlers under test
  uow: { authUsers: { findAll: vi.fn(), update: vi.fn(), create: vi.fn(), findById: vi.fn() } },
}));

// ─── Import router AFTER mocks are hoisted ───────────────────────────────────
import authRoutes from "../../routes/auth.routes.js";
import { signToken } from "../auth.controller.js";

// ─── Shared test fixtures ─────────────────────────────────────────────────────
const VERIFIED_USER = {
  id: "user-uuid-1",
  email: "alice@example.com",
  passwordHash: "$2a$12$hashedpassword",
  displayName: "Alice",
  avatarUrl: null,
  isVerified: true,
  verificationToken: null,
  verificationTokenExpires: null,
  googleId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const UNVERIFIED_USER = {
  ...VERIFIED_USER,
  id: "user-uuid-2",
  email: "bob@example.com",
  isVerified: false,
  verificationToken: "123456",
  verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

/** Creates a minimal Express app — mirrors the real app but without unrelated middleware */
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Happy paths ──────────────────────────────────────────────────────────

  it("registers a new user and returns requireVerification payload", async () => {
    // Arrange
    mockAuthService.findUserByEmail.mockResolvedValue(null);
    mockAuthService.registerUser.mockResolvedValue({
      ...UNVERIFIED_USER,
      verificationToken: "654321",
    });

    // Act
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "new@example.com", password: "secure1", displayName: "New User" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      requireVerification: true,
      email: "bob@example.com",
      devVerificationCode: "654321",
      message: expect.stringContaining("verify"),
    });
  });

  it("lowercases the email before calling the service (Zod transform)", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(null);
    mockAuthService.registerUser.mockResolvedValue({ ...UNVERIFIED_USER, email: "upper@example.com", verificationToken: "000000" });

    await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "UPPER@EXAMPLE.COM", password: "secure1" });

    expect(mockAuthService.findUserByEmail).toHaveBeenCalledWith("upper@example.com");
  });

  it("displayName is optional — register succeeds without it", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(null);
    mockAuthService.registerUser.mockResolvedValue({ ...UNVERIFIED_USER, verificationToken: "111111" });

    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "nodisplay@example.com", password: "secure1" });

    expect(res.status).toBe(200);
    expect(mockAuthService.registerUser).toHaveBeenCalledWith(
      "nodisplay@example.com",
      "secure1",
      undefined,
    );
  });

  // ── Zod validation errors (400) ──────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ password: "secure1" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    // Service must never be called — Zod should short-circuit
    expect(mockAuthService.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
    expect(mockAuthService.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when email is malformed", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "secure1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("returns 400 when password is shorter than 6 characters", async () => {
    // Zod catches this before the controller even runs
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "12345" });

    expect(res.status).toBe(400);
    expect(mockAuthService.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when displayName exceeds 80 characters", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "secure1", displayName: "x".repeat(81) });

    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({});

    expect(res.status).toBe(400);
  });

  // ── Conflict (409) ────────────────────────────────────────────────────────

  it("returns 409 when the email is already registered", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(VERIFIED_USER);

    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "secure1" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
    expect(mockAuthService.registerUser).not.toHaveBeenCalled();
  });

  // ── Server error (500) ────────────────────────────────────────────────────

  it("returns 500 when the DB throws unexpectedly", async () => {
    mockAuthService.findUserByEmail.mockRejectedValue(new Error("DB connection refused"));

    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "crash@example.com", password: "secure1" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/registration failed/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Happy path ────────────────────────────────────────────────────────────

  it("logs in a verified user and sets an httpOnly cookie", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(VERIFIED_USER);
    mockAuthService.verifyPassword.mockResolvedValue(true);

    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "correct" });

    expect(res.status).toBe(200);
    // Cookie must be present
    const setCookie = res.headers["set-cookie"] as string[] | string;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
    expect(cookieStr).toMatch(/ds_token=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
    // Response body must only expose safe fields
    expect(res.body.user).toMatchObject({
      id: VERIFIED_USER.id,
      email: VERIFIED_USER.email,
      displayName: VERIFIED_USER.displayName,
      isVerified: true,
    });
    // passwordHash must NEVER appear in the response
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("lowercases email before lookup", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(VERIFIED_USER);
    mockAuthService.verifyPassword.mockResolvedValue(true);

    await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "ALICE@EXAMPLE.COM", password: "correct" });

    expect(mockAuthService.findUserByEmail).toHaveBeenCalledWith("alice@example.com");
  });

  // ── Zod validation (400) ──────────────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ password: "correct" });

    expect(res.status).toBe(400);
    expect(mockAuthService.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "alice@example.com" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "correct" });

    expect(res.status).toBe(400);
  });

  // ── Auth failures (401) ───────────────────────────────────────────────────

  it("returns 401 when user does not exist", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(null);

    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it("returns 401 for Google-only accounts (no passwordHash)", async () => {
    // A user created via Google OAuth has no password — logging in with email/pw must fail
    mockAuthService.findUserByEmail.mockResolvedValue({ ...VERIFIED_USER, passwordHash: null });

    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "anypassword" });

    expect(res.status).toBe(401);
    expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
  });

  it("returns 401 when password is incorrect", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(VERIFIED_USER);
    mockAuthService.verifyPassword.mockResolvedValue(false);

    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  // ── Unverified account (403) ──────────────────────────────────────────────

  it("returns 403 and a fresh verification code for unverified accounts", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(UNVERIFIED_USER);
    mockAuthService.verifyPassword.mockResolvedValue(true);
    mockAuthService.createNewVerificationToken.mockResolvedValue({
      ...UNVERIFIED_USER,
      verificationToken: "999888",
    });

    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "correct" });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      requireVerification: true,
      email: "bob@example.com",
      devVerificationCode: "999888",
    });
    // A new code must be issued — not silently reusing the old one
    expect(mockAuthService.createNewVerificationToken).toHaveBeenCalledWith(UNVERIFIED_USER.id);
  });

  // ── Server error (500) ────────────────────────────────────────────────────

  it("returns 500 on unexpected service failure", async () => {
    mockAuthService.findUserByEmail.mockRejectedValue(new Error("timeout"));

    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "correct" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/login failed/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-email
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/verify-email", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Happy path ────────────────────────────────────────────────────────────

  it("verifies email with correct code and sets auth cookie", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(UNVERIFIED_USER);
    mockAuthService.verifyUserEmail.mockResolvedValue(VERIFIED_USER);

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "bob@example.com", code: "123456" });

    expect(res.status).toBe(200);
    const setCookie = res.headers["set-cookie"] as string[] | string;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
    expect(cookieStr).toMatch(/ds_token=/);
    expect(mockAuthService.verifyUserEmail).toHaveBeenCalledWith(UNVERIFIED_USER.id);
  });

  it("auto-logs-in an already-verified user (idempotent verify)", async () => {
    // If a user hits verify again after being verified, they should just get logged in.
    mockAuthService.findUserByEmail.mockResolvedValue(VERIFIED_USER);

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "alice@example.com", code: "anycode" });

    expect(res.status).toBe(200);
    expect(mockAuthService.verifyUserEmail).not.toHaveBeenCalled();
    const setCookie = res.headers["set-cookie"] as string[] | string;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
    expect(cookieStr).toMatch(/ds_token=/);
  });

  it("proceeds when verificationTokenExpires is null (no expiry enforced)", async () => {
    // Some accounts may have a token with no expiry — the code check should still pass
    const userNoExpiry = { ...UNVERIFIED_USER, verificationTokenExpires: null };
    mockAuthService.findUserByEmail.mockResolvedValue(userNoExpiry);
    mockAuthService.verifyUserEmail.mockResolvedValue(VERIFIED_USER);

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "bob@example.com", code: "123456" });

    expect(res.status).toBe(200);
    expect(mockAuthService.verifyUserEmail).toHaveBeenCalled();
  });

  // ── Zod validation (400) ──────────────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ code: "123456" });

    expect(res.status).toBe(400);
    expect(mockAuthService.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when code is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "bob@example.com" });

    expect(res.status).toBe(400);
  });

  // ── Not found (404) ───────────────────────────────────────────────────────

  it("returns 404 when user does not exist", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(null);

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "ghost@example.com", code: "123456" });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  // ── Bad request (400) ─────────────────────────────────────────────────────

  it("returns 400 when the verification code is wrong", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(UNVERIFIED_USER);

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "bob@example.com", code: "000000" }); // wrong code

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid verification code/i);
    expect(mockAuthService.verifyUserEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when the verification code is expired", async () => {
    const expiredUser = {
      ...UNVERIFIED_USER,
      verificationTokenExpires: new Date(Date.now() - 1000), // 1 second in the past
    };
    mockAuthService.findUserByEmail.mockResolvedValue(expiredUser);

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "bob@example.com", code: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
    expect(mockAuthService.verifyUserEmail).not.toHaveBeenCalled();
  });

  // ── Server error (500) ────────────────────────────────────────────────────

  it("returns 500 on unexpected service failure", async () => {
    mockAuthService.findUserByEmail.mockRejectedValue(new Error("DB crash"));

    const res = await request(buildApp())
      .post("/api/auth/verify-email")
      .send({ email: "bob@example.com", code: "123456" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/verification failed/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-verification
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Happy path ────────────────────────────────────────────────────────────

  it("issues a new code for an unverified user", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(UNVERIFIED_USER);
    mockAuthService.createNewVerificationToken.mockResolvedValue({
      ...UNVERIFIED_USER,
      verificationToken: "777777",
    });

    const res = await request(buildApp())
      .post("/api/auth/resend-verification")
      .send({ email: "bob@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      requireVerification: true,
      email: "bob@example.com",
      devVerificationCode: "777777",
    });
    expect(mockAuthService.createNewVerificationToken).toHaveBeenCalledWith(UNVERIFIED_USER.id);
  });

  it("returns 200 with 'already verified' message when user is already verified", async () => {
    // Should not generate a new token — just confirm verified status
    mockAuthService.findUserByEmail.mockResolvedValue(VERIFIED_USER);

    const res = await request(buildApp())
      .post("/api/auth/resend-verification")
      .send({ email: "alice@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/already verified/i);
    expect(mockAuthService.createNewVerificationToken).not.toHaveBeenCalled();
  });

  // ── Zod validation (400) ──────────────────────────────────────────────────

  it("returns 400 when email is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/resend-verification")
      .send({});

    expect(res.status).toBe(400);
    expect(mockAuthService.findUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await request(buildApp())
      .post("/api/auth/resend-verification")
      .send({ email: "bad-email" });

    expect(res.status).toBe(400);
  });

  // ── Not found (404) ───────────────────────────────────────────────────────

  it("returns 404 when user does not exist", async () => {
    mockAuthService.findUserByEmail.mockResolvedValue(null);

    const res = await request(buildApp())
      .post("/api/auth/resend-verification")
      .send({ email: "ghost@example.com" });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  // ── Server error (500) ────────────────────────────────────────────────────

  it("returns 500 on unexpected service failure", async () => {
    mockAuthService.findUserByEmail.mockRejectedValue(new Error("network error"));

    const res = await request(buildApp())
      .post("/api/auth/resend-verification")
      .send({ email: "bob@example.com" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/resend/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/logout", () => {
  it("clears the ds_token cookie and returns { ok: true }", async () => {
    const res = await request(buildApp()).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    // Cookie must be cleared (Set-Cookie header with empty value or Max-Age=0)
    const setCookie = res.headers["set-cookie"] as string[] | string;
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : (setCookie ?? "");
    expect(cookieStr).toMatch(/ds_token=/);
    expect(cookieStr).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });

  it("returns { ok: true } even when called without an active session", async () => {
    // Logout must be idempotent — no cookie to clear is fine
    const res = await request(buildApp()).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/user
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/auth/user", () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Happy path ────────────────────────────────────────────────────────────

  it("returns safe user shape when a valid cookie is present", async () => {
    mockAuthService.findUserById.mockResolvedValue(VERIFIED_USER);
    const token = signToken(VERIFIED_USER.id);

    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", `ds_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: VERIFIED_USER.id,
      email: VERIFIED_USER.email,
      displayName: VERIFIED_USER.displayName,
      isVerified: true,
    });
    // Safe-user guard: sensitive fields must never be exposed
    expect(res.body).not.toHaveProperty("passwordHash");
    expect(res.body).not.toHaveProperty("verificationToken");
    expect(res.body).not.toHaveProperty("googleId");
  });

  it("uses displayName as 'name' when displayName is set", async () => {
    mockAuthService.findUserById.mockResolvedValue(VERIFIED_USER);
    const token = signToken(VERIFIED_USER.id);

    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", `ds_token=${token}`);

    expect(res.body.name).toBe(VERIFIED_USER.displayName);
  });

  it("falls back to email as 'name' when displayName is null", async () => {
    // safeUser() has: name: displayName ?? email ?? "User"
    mockAuthService.findUserById.mockResolvedValue({ ...VERIFIED_USER, displayName: null });
    const token = signToken(VERIFIED_USER.id);

    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", `ds_token=${token}`);

    expect(res.body.name).toBe(VERIFIED_USER.email);
  });

  it("falls back to 'User' when both displayName and email are null", async () => {
    mockAuthService.findUserById.mockResolvedValue({ ...VERIFIED_USER, displayName: null, email: null });
    const token = signToken(VERIFIED_USER.id);

    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", `ds_token=${token}`);

    expect(res.body.name).toBe("User");
  });

  // ── Auth failures (401) ───────────────────────────────────────────────────

  it("returns 401 when no cookie is present", async () => {
    const res = await request(buildApp()).get("/api/auth/user");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not authenticated/i);
    expect(mockAuthService.findUserById).not.toHaveBeenCalled();
  });

  it("returns 401 when the JWT is tampered with", async () => {
    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", "ds_token=this.is.not.a.real.jwt");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid session/i);
  });

  it("returns 401 when JWT is signed with a different secret", async () => {
    const forgedToken = jwt.sign({ sub: "hacker-id" }, "wrong-secret");

    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", `ds_token=${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid session/i);
  });

  it("returns 401 when user has been deleted after the token was issued", async () => {
    // Token is valid but user no longer exists in DB
    mockAuthService.findUserById.mockResolvedValue(null);
    const token = signToken("deleted-user-id");

    const res = await request(buildApp())
      .get("/api/auth/user")
      .set("Cookie", `ds_token=${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/user not found/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/config
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/auth/config", () => {
  it("returns googleEnabled: false when Google env vars are not set", async () => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const res = await request(buildApp()).get("/api/auth/config");

    expect(res.status).toBe(200);
    expect(res.body.googleEnabled).toBe(false);

    // Restore env
    if (GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
    if (GOOGLE_CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = GOOGLE_CLIENT_SECRET;
  });

  it("returns googleEnabled: true when both Google env vars are set", async () => {
    process.env.GOOGLE_CLIENT_ID = "fake-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "fake-client-secret";

    const res = await request(buildApp()).get("/api/auth/config");

    expect(res.status).toBe(200);
    expect(res.body.googleEnabled).toBe(true);

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it("returns googleEnabled: false when only GOOGLE_CLIENT_ID is set", async () => {
    process.env.GOOGLE_CLIENT_ID = "fake-client-id";
    delete process.env.GOOGLE_CLIENT_SECRET;

    const res = await request(buildApp()).get("/api/auth/config");

    expect(res.body.googleEnabled).toBe(false);

    delete process.env.GOOGLE_CLIENT_ID;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/google (Google OAuth guard)
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/auth/google", () => {
  it("redirects to /auth?error=google_not_configured when Google env vars are absent", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const res = await request(buildApp()).get("/api/auth/google");

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/google_not_configured/);
  });
});
