describe("Environment Variables (.env.test)", () => {
  it("should have core environment variables loaded from .env.test", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.JWT_SECRET).toBe("test-secret-key-for-jest");
    expect(process.env.ALLOWED_ORIGIN).toBe("http://localhost:3000");
    expect(process.env.APP_NAME).toBe("SITAKO-backend");
    expect(process.env.APP_ENV).toBe("test");
    expect(process.env.PORT).toBe("8080");
  });

  it("should have S3/R2 storage environment variables loaded from .env.test", () => {
    expect(process.env.S3_ENDPOINT).toBeDefined();
    expect(process.env.S3_ACCESS_KEY_ID).toBeDefined();
    expect(process.env.S3_SECRET_ACCESS_KEY).toBeDefined();
    expect(process.env.S3_BUCKET_NAME).toBeDefined();
    expect(process.env.PUBLIC_STORAGE_URL).toBeDefined();
  });

  it("should have Tripay payment gateway environment variables loaded from .env.test", () => {
    expect(process.env.TRIPAY_API_KEY).toBe("test-api-key");
    expect(process.env.TRIPAY_PRIVATE_KEY).toBe("test-private-key");
    expect(process.env.TRIPAY_MERCHANT_CODE).toBe("TEST123");
    expect(process.env.TRIPAY_API_URL).toBe("https://tripay.co.id/api-sandbox/");
  });

  it("should have Database and Redis environment variables loaded from .env.test", () => {
    expect(process.env.POSTGRES_HOST).toBe("localhost");
    expect(process.env.POSTGRES_PORT).toBe("5432");
    expect(process.env.POSTGRES_USER).toBe("postgres");
    expect(process.env.POSTGRES_PASSWORD).toBe("password");
    expect(process.env.POSTGRES_DB).toBe("sitako_test");
    expect(process.env.DATABASE_URL).toBe(
      "postgresql://postgres:password@localhost:5432/sitako_test"
    );
    expect(process.env.REDIS_HOST).toBe("localhost");
    expect(process.env.REDIS_PORT).toBe("6379");
    expect(process.env.REDIS_URL).toBe("redis://localhost:6379");
  });

  it("should have Mail environment variables loaded from .env.test", () => {
    expect(process.env.MAIL_HOST).toBe("smtp.gmail.com");
    expect(process.env.MAIL_PORT).toBe("465");
    expect(process.env.MAIL_USER).toBe("test@gmail.com");
    expect(process.env.MAIL_PASS).toBe("test-password");
    expect(process.env.MAIL_FROM).toBe("test@gmail.com");
  });
});
