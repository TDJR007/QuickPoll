import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: 'info',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

/*
    📌 pino-pretty is dev only — it makes logs human readable with colors and formatting. 
    In production you want raw JSON logs because machines (like Datadog, Grafana etc.) parse them.
    That's why we conditionally apply the transport based on NODE_ENV. 
    Real pattern, used everywhere.
*/