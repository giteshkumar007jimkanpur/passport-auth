import { createLogger, transports, format } from 'winston';
import { isProd } from '../config/env.config.js';

const logger = createLogger({
  level: isProd ? 'http' : 'debug',
  transports: [new transports.Console()],
  format: isProd
    ? format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      )
    : format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ level, message, timestamp, ...rest }) => {
          const meta = Object.keys(rest).length
            ? `${JSON.stringify(rest)}`
            : '';
          return `[${timestamp}] ${level}: ${message} ${meta}`;
        }),
      ),
});

logger.http = (msg) => logger.log({ level: 'http', message: msg });

export default logger;
