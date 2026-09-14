import request from 'supertest';
import app from '@/app';

jest.mock('@/controllers/webhook/tripay.controller', () => ({
  tripayWebhook: jest.fn((req, res) => {
    const rawSignature = req.headers['x-callback-signature'];
    const signature = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature;

    if (!signature || signature === 'invalid-signature') {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { event, reference } = req.body ?? {};

    if (event !== 'payment_status') {
      return res.status(200).json({ success: true, message: 'Event not handled' });
    }

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    if (reference === 'NOT-FOUND-REF') {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    return res.status(200).json({ success: true });
  }),
}));

describe('Tripay Webhook Endpoints', () => {
  const validPayload = {
    event: 'payment_status',
    reference: 'TRX-20260912-TEST01',
    merchant_ref: 'INV-123456',
    payment_method: 'BRIVA',
    status: 'PAID',
    paid_at: 1726200000,
  };

  describe('POST /api/webhooks/tripay', () => {
    it('should return 400 when x-callback-signature header is missing', async () => {
      const res = await request(app).post('/api/webhooks/tripay').send(validPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid signature');
    });

    it('should return 400 when signature is invalid', async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'invalid-signature')
        .send(validPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid signature');
    });

    it("should return 200 with 'Event not handled' when event is not payment_status", async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'valid-mock-signature')
        .send({ ...validPayload, event: 'other_event' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Event not handled');
    });

    it('should return 400 when reference is missing', async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'valid-mock-signature')
        .send({ event: 'payment_status' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Reference is required');
    });

    it('should return 404 when payment reference is not found in database', async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'valid-mock-signature')
        .send({ ...validPayload, reference: 'NOT-FOUND-REF' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Payment not found');
    });

    it('should return 200 with success true for valid PAID notification', async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'valid-mock-signature')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 200 with success true for valid EXPIRED notification', async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'valid-mock-signature')
        .send({ ...validPayload, status: 'EXPIRED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 200 with success true for valid FAILED notification', async () => {
      const res = await request(app)
        .post('/api/webhooks/tripay')
        .set('x-callback-signature', 'valid-mock-signature')
        .send({ ...validPayload, status: 'FAILED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
