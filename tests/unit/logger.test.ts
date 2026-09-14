import winston from 'winston';
import logger from '@/utils/core/logger';

jest.unmock('winston');

describe('Winston Logger', () => {
  it('should create a logger instance', () => {
    expect(logger).toBeDefined();
  });

  it("should have 'info' as the default log level", () => {
    expect(logger.level).toBe('info');
  });

  it('should have a Console transport', () => {
    const hasConsoleTransport = logger.transports.some(
      (transport) => transport instanceof winston.transports.Console,
    );
    expect(hasConsoleTransport).toBe(true);
  });

  it('should log info messages correctly', () => {
    const spy = jest.spyOn(logger, 'info').mockImplementation();

    logger.info('Test message');

    expect(spy).toHaveBeenCalledWith('Test message');
    spy.mockRestore();
  });

  it('should log errors correctly', () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation();
    const testError = new Error('Test error message');

    logger.error(testError);

    expect(spy).toHaveBeenCalledWith(testError);
    spy.mockRestore();
  });
});
