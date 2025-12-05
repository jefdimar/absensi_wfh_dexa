import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const createLogger = (serviceName: string) => {
  return WinstonModule.createLogger({
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize({ all: true }),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            let msg = `${timestamp} [${serviceName}] ${level}: ${message}`;
            if (context) {
              msg += ` [${context}]`;
            }
            if (Object.keys(meta).length > 0) {
              msg += ` ${JSON.stringify(meta)}`;
            }
            return msg;
          }),
        ),
      }),
      // File transport for errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });
};
