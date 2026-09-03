import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashRefreshToken } from "../lib/tokens.js";
import { AppError } from "../middleware/errorHandler.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

process.env.JWT_SECRET = "secreto-de-prueba-suficientemente-largo";

const { prisma } = await import("../lib/prisma.js");
const auth = await import("./auth.js");

const mock = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  refreshToken: Record<string, ReturnType<typeof vi.fn>>;
};

const enUnMes = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const ayer = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
  mock.refreshToken.create.mockResolvedValue({});
});

describe("register", () => {
  it("rechaza un email ya registrado", async () => {
    mock.user.findUnique.mockResolvedValue({ id: "u1", email: "ana@queleo.test" });

    await expect(auth.register("ana@queleo.test", "unaClaveLarga", "Ana")).rejects.toThrow(
      AppError,
    );
    expect(mock.user.create).not.toHaveBeenCalled();
  });

  it("nunca guarda la contraseña en claro", async () => {
    mock.user.findUnique.mockResolvedValue(null);
    mock.user.create.mockResolvedValue({ id: "u1", email: "ana@queleo.test", name: "Ana" });

    await auth.register("ana@queleo.test", "unaClaveLarga", "Ana");

    const guardado = mock.user.create.mock.calls[0][0].data;
    expect(guardado.passwordHash).not.toBe("unaClaveLarga");
    expect(await bcrypt.compare("unaClaveLarga", guardado.passwordHash)).toBe(true);
  });

  it("no devuelve el hash de la contraseña al cliente", async () => {
    mock.user.findUnique.mockResolvedValue(null);
    mock.user.create.mockResolvedValue({ id: "u1", email: "ana@queleo.test", name: "Ana" });

    const { user } = await auth.register("ana@queleo.test", "unaClaveLarga", "Ana");

    expect(user).not.toHaveProperty("passwordHash");
    // El select tiene que pedir sólo los campos públicos.
    expect(mock.user.create.mock.calls[0][0].select).toEqual({
      id: true,
      email: true,
      name: true,
    });
  });
});

describe("login", () => {
  const usuario = async () => ({
    id: "u1",
    email: "ana@queleo.test",
    name: "Ana",
    passwordHash: await bcrypt.hash("unaClaveLarga", 10),
  });

  it("rechaza una contraseña incorrecta", async () => {
    mock.user.findUnique.mockResolvedValue(await usuario());

    await expect(auth.login("ana@queleo.test", "otraCosa")).rejects.toThrow(AppError);
  });

  it("no revela si el email existe o no", async () => {
    // Los dos casos tienen que responder igual: si el mensaje difiere, se
    // puede averiguar qué emails están registrados probando de a uno.
    mock.user.findUnique.mockResolvedValue(null);
    const inexistente = await auth.login("nadie@queleo.test", "unaClaveLarga").catch((e) => e);

    mock.user.findUnique.mockResolvedValue(await usuario());
    const claveMal = await auth.login("ana@queleo.test", "otraCosa").catch((e) => e);

    expect(inexistente.message).toBe(claveMal.message);
    expect(inexistente.status).toBe(claveMal.status);
  });

  it("con credenciales válidas emite sesión y no expone el hash", async () => {
    mock.user.findUnique.mockResolvedValue(await usuario());

    const resultado = await auth.login("ana@queleo.test", "unaClaveLarga");

    expect(resultado.user).toEqual({ id: "u1", email: "ana@queleo.test", name: "Ana" });
    expect(resultado.accessToken).toBeTruthy();
    expect(resultado.refreshToken).toBeTruthy();
  });

  it("guarda el refresh token hasheado, nunca en claro", async () => {
    mock.user.findUnique.mockResolvedValue(await usuario());

    const { refreshToken } = await auth.login("ana@queleo.test", "unaClaveLarga");

    const guardado = mock.refreshToken.create.mock.calls[0][0].data;
    expect(guardado.tokenHash).not.toBe(refreshToken);
    expect(guardado.tokenHash).toBe(hashRefreshToken(refreshToken));
  });
});

describe("refresh", () => {
  const publico = { id: "u1", email: "ana@queleo.test", name: "Ana" };

  it("rechaza un token que no está en la base", async () => {
    mock.refreshToken.findUnique.mockResolvedValue(null);

    await expect(auth.refresh("inventado")).rejects.toThrow(AppError);
  });

  it("busca por hash y no por el token en claro", async () => {
    mock.refreshToken.findUnique.mockResolvedValue(null);

    await auth.refresh("abc123").catch(() => {});

    expect(mock.refreshToken.findUnique.mock.calls[0][0].where).toEqual({
      tokenHash: hashRefreshToken("abc123"),
    });
  });

  it("rechaza un token vencido y lo borra", async () => {
    mock.refreshToken.findUnique.mockResolvedValue({
      id: "r1",
      userId: "u1",
      expiresAt: ayer(),
      user: publico,
    });

    await expect(auth.refresh("vencido")).rejects.toThrow(AppError);
    expect(mock.refreshToken.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
  });

  it("renueva el acceso sin rotar el refresh token", async () => {
    // Rotarlo rompía con dos pestañas refrescando a la vez: la segunda
    // llegaba con un token ya invalidado.
    mock.refreshToken.findUnique.mockResolvedValue({
      id: "r1",
      userId: "u1",
      expiresAt: enUnMes(),
      user: publico,
    });

    const resultado = await auth.refresh("vigente");

    expect(resultado.accessToken).toBeTruthy();
    expect(resultado.user).toEqual(publico);
    expect(mock.refreshToken.delete).not.toHaveBeenCalled();
    expect(mock.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("borra la sesión por hash", async () => {
    mock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    await auth.logout("abc123");

    expect(mock.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: hashRefreshToken("abc123") },
    });
  });

  it("no falla si el token ya no existe", async () => {
    mock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    await expect(auth.logout("inventado")).resolves.toBeUndefined();
  });
});
