import { Request, Response } from 'express';
import { getTelemetryInfo } from '@/instrumentation';
import { sendError, sendSuccess } from '@/utils/core/handler';
import { withSpan } from '@/utils/core/tracer';

export const getTelemetryStatus = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const data = await withSpan('telemetry.status.check', async (span) => {
      const info = getTelemetryInfo();
      span.setAttribute('telemetry.enabled', info.enabled);
      span.setAttribute('service.name', info.serviceName);
      return info;
    });

    return sendSuccess(res, { data }, 'Informasi status OpenTelemetry berhasil diambil');
  } catch (error) {
    return sendError(res, error, 'getTelemetryStatus');
  }
};
