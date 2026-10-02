import { trace, context, Span, SpanStatusCode, Tracer } from '@opentelemetry/api';

const TRACER_NAME = process.env.OTEL_SERVICE_NAME || process.env.APP_NAME || 'sitako-server';

export const getTracer = (name: string = TRACER_NAME): Tracer => {
  return trace.getTracer(name);
};

export const withSpan = async <T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> => {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span: Span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
};

export { trace, context };
