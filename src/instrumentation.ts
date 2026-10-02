import dotenv from 'dotenv';
dotenv.config();

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const isOtelEnabled = process.env.OTEL_ENABLED !== 'false';
const serviceName = process.env.OTEL_SERVICE_NAME || process.env.APP_NAME || 'sitako-server';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const environment = process.env.NODE_ENV || 'development';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const tracesEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${otlpEndpoint.replace(/\/$/, '')}/v1/traces`;
const metricsEndpoint =
  process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
  `${otlpEndpoint.replace(/\/$/, '')}/v1/metrics`;
const logSpans = process.env.OTEL_LOG_SPANS === 'true';

let sdk: NodeSDK | null = null;

export const getTelemetryInfo = () => ({
  enabled: isOtelEnabled,
  serviceName,
  serviceVersion,
  environment,
  otlpEndpoint,
  tracesEndpoint,
  metricsEndpoint,
  logSpans,
});

if (isOtelEnabled) {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    'deployment.environment': environment,
  });

  const traceExporter = logSpans
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({ url: tracesEndpoint });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: metricsEndpoint }),
    exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL) || 60000,
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => {
            const url = req.url || '';
            return url.startsWith('/metrics') || url.startsWith('/api/health');
          },
        },
      }),
    ],
  });

  try {
    sdk.start();
    // eslint-disable-next-line no-console
    console.log(`[OpenTelemetry] SDK initialized successfully for service: ${serviceName}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[OpenTelemetry] Failed to initialize SDK:', error);
  }

  const shutdown = async () => {
    if (sdk) {
      try {
        await sdk.shutdown();
        // eslint-disable-next-line no-console
        console.log('[OpenTelemetry] SDK shut down cleanly');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[OpenTelemetry] Error during SDK shutdown:', err);
      }
    }
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });

  process.on('SIGINT', () => {
    void shutdown();
  });
}

export default sdk;
