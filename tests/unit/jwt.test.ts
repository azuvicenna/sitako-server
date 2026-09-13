import { generateToken, verifyToken } from "@/utils/auth/jwt";


describe("JWT Utils", () => {
  const mockPayload = { userId: 123, role: "admin" };

  it("should generate a token string", () => {
    const token = generateToken(mockPayload);
    expect(typeof token).toBe("string");
  });

  it("should verify and decode a valid token", () => {
    const token = generateToken(mockPayload);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(mockPayload);
  });

  it("should return null for invalid token", () => {
    const decoded = verifyToken("token-ngasal");
    expect(decoded).toBeNull();
  });
});
