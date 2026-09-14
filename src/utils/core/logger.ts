import winston, { type Logger } from 'winston';

const { combine, timestamp, errors, colorize, printf, json } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

const consoleFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack || message}${metaString}`;
});

const logger: Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  transports: [
    new winston.transports.Console({
      format: isProduction ? json() : combine(colorize(), consoleFormat),
    }),
  ],
});

export default logger;
