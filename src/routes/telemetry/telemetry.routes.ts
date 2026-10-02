import { Router } from 'express';
import { getTelemetryStatus } from '@/controllers/telemetry/telemetry.controller';

const router: Router = Router();

router.get('/status', getTelemetryStatus);

export default router;
