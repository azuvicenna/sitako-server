import { Request, Response } from 'express';
import { verifyRole } from '@/middlewares/auth.middleware';

describe('verifyRole Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should return 401 if user is not attached to request', () => {
    mockReq = {};
    const middleware = verifyRole('Pustakawan');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('belum terautentikasi'),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if user role does not match allowed roles', () => {
    mockReq = {
      user: { id: 'u-1', role: 'Anggota' },
    };
    const middleware = verifyRole('Pustakawan');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('tidak memiliki izin'),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if user role matches (case-insensitive)', () => {
    mockReq = {
      user: { id: 'u-1', role: 'pustakawan' },
    };
    const middleware = verifyRole('Pustakawan');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should allow multiple permitted roles', () => {
    mockReq = {
      user: { id: 'u-2', role: 'Anggota' },
    };
    const middleware = verifyRole('Pustakawan', 'Anggota');

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
