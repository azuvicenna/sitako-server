import nodemailer from "nodemailer";
import logger from "@/utils/core/logger";
import { sendEmail } from "@/utils/services/mail";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

jest.mock("@/utils/core/logger", () => ({
  error: jest.fn(),
}));

describe("sendEmail Unit Test", () => {
  let mockSendMail: jest.Mock;

  beforeAll(() => {
    mockSendMail = (nodemailer.createTransport() as any).sendMail;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should send email successfully and return messageId", async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: "msg-123" });

    const result = await sendEmail(
      "target@example.com",
      "Test Subject",
      "<p>Halo Bos</p>",
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "target@example.com",
        subject: "Test Subject",
        html: "<p>Halo Bos</p>",
      }),
    );
    expect(result).toEqual({ success: true, messageId: "msg-123" });
  });

  it("should catch error, log it, and return success false", async () => {
    const testError = new Error("SMTP Connection Timeout");
    mockSendMail.mockRejectedValueOnce(testError);

    const result = await sendEmail(
      "target@example.com",
      "Test Subject",
      "<p>Halo Bos</p>",
    );

    expect(logger.error).toHaveBeenCalledWith(
      "Error sending email to target@example.com: SMTP Connection Timeout",
      {
        error: testError,
      },
    );
    expect(result).toEqual({ success: false, error: testError });
  });
});
