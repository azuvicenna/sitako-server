import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// 1. Registry: Wadah utama untuk menampung semua metrik
export const register = new client.Registry();

// Mengambil metrik bawaan sistem (CPU usage, memori heap, event loop lag, dll)
client.collectDefaultMetrics({ register });

// 2. Histogram: Mengukur seberapa cepat/lambat request selesai diproses (latensi)
// Bucket membagi durasi ke beberapa kelompok waktu dalam satuan detik (misal: 50ms, 100ms, dst)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durasi pemrosesan HTTP request dalam detik',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register], // Langsung didaftarkan ke registry di sini
});

// 3. Counter: Nilai yang hanya bisa bertambah terus (menghitung total volume request)
const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total request HTTP yang masuk',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Helper untuk mengambil template route yang aman dari "High Cardinality".
 * Contoh: /users/123 -> diubah jadi /users/:id.
 * Kalau route tidak terdaftar (misal 404 bot scanner), jangan simpan path mentah ke Prometheus.
 */
function resolveRoute(req: Request): string {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }
  return 'unmatched_route';
}

// 4. Middleware: Dipasang paling atas aplikasi untuk memantau request yang masuk
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Nyalakan timer stopwatch sebelum request masuk ke controller
  const stopTimer = httpRequestDuration.startTimer();

  // Tunggu sampai response benar-benar selesai dikirim ke client
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: resolveRoute(req),
      status_code: String(res.statusCode),
    };

    // Hentikan timer dan catat durasinya ke histogram
    stopTimer(labels);

    // Tambah hitungan counter (+1)
    httpRequestTotal.inc(labels);
  });

  next();
}

// 5. Handler: Endpoint GET /metrics yang akan dibaca (di-scrape) berkala oleh Prometheus
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end();
  }
}
