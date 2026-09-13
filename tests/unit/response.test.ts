import { Response } from "express";
import {
  getPaginationParams,
  sendSuccess,
  sendError,
  sendFail,
} from "@/utils/core/handler";
import logger from "@/utils/core/logger";

describe("Response and Pagination Utils", () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getPaginationParams", () => {
    it("should return default values when query is empty", () => {
      const result = getPaginationParams({});
      expect(result).toEqual({ page: 1, limit: 10, search: "" });
    });

    it("should parse valid string query parameters", () => {
      const result = getPaginationParams({
        page: "2",
        limit: "20",
        search: "halo",
      });
      expect(result).toEqual({ page: 2, limit: 20, search: "halo" });
    });

    it("should fallback to correct defaults if inputs are negative or zero", () => {
      const result = getPaginationParams({ page: "-5", limit: "0" });
      expect(result).toEqual({ page: 1, limit: 10, search: "" });
    });
  });

  describe("sendSuccess", () => {
    it("should send a 200 response with default message", () => {
      sendSuccess(mockRes as Response, { items: [] });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Data retrieved successfully",
        items: [],
      });
    });

    it("should send a 200 response with custom message", () => {
      sendSuccess(mockRes as Response, { id: 123 }, "Data found");

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Data found",
        id: 123,
      });
    });
  });

  describe("sendError", () => {
    it("should log the error and send a 500 response", () => {
      const spyLogger = jest.spyOn(logger, "error").mockImplementation();
      const testError = new Error("Database timeout");

      sendError(mockRes as Response, testError, "getUserData");

      expect(spyLogger).toHaveBeenCalledWith(
        "Error pada getUserData: Database timeout",
        { error: testError },
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
      });

      spyLogger.mockRestore();
    });
  });

  describe("sendFail", () => {
    it("should send the correct status code and failure message", () => {
      sendFail(mockRes as Response, 400, "Bad Request");

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Bad Request",
      });
    });

    it("should handle 404 status code with custom message", () => {
      sendFail(mockRes as Response, 404, "Not Found");

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Not Found",
      });
    });
  });
});
