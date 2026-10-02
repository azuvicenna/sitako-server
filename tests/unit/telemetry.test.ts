import { Request, Response } from 'express';
import { getTelemetryInfo } from '@/instrumentation';
import { getTracer, withSpan } from '@/utils/core/tracer';
import { getTelemetryStatus } from '@/controllers/telemetry/telemetry.controller';

describe('OpenTelemetry Utilities & Controller', () => {
  describe('getTelemetryInfo', () => {
    it('should return valid telemetry configuration info', () => {
      const info = getTelemetryInfo();

      expect(info).toHaveProperty('enabled');
      expect(info).toHaveProperty('serviceName');
      expect(info).toHaveProperty('serviceVersion');
      expect(info).toHaveProperty('environment');
      expect(info).toHaveProperty('otlpEndpoint');
      expect(info).toHaveProperty('tracesEndpoint');
      expect(info).toHaveProperty('metricsEndpoint');
      expect(typeof info.enabled).toBe('boolean');
    });
  });

  describe('tracer and withSpan', () => {
    it('should obtain a tracer instance', () => {
      const tracer = getTracer('test-tracer');
      expect(tracer).toBeDefined();
      expect(typeof tracer.startActiveSpan).toBe('function');
    });

    it('should execute a function within a span successfully and return its result', async () => {
      const result = await withSpan(
        'test.span.success',
        async (span) => {
          expect(span).toBeDefined();
          span.setAttribute('test.attr', 'value');
          return 42;
        },
        { initial: true },
      );

      expect(result).toBe(42);
    });

    it('should record exception and rethrow error when inside span', async () => {
      const errorMsg = 'Span test error';

      await expect(
        withSpan('test.span.error', async () => {
          throw new Error(errorMsg);
        }),
      ).rejects.toThrow(errorMsg);
    });
  });

  describe('getTelemetryStatus controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it('should return 200 with telemetry status payload', async () => {
      await getTelemetryStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Informasi status OpenTelemetry berhasil diambil',
          data: expect.objectContaining({
            serviceName: expect.any(String),
          }),
        }),
      );
    });
  });
});
