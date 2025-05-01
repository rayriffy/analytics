import libWinston from 'winston'
import LokiTransport from 'winston-loki'

export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly'

export type LogMethod = (message: string, fields?: Record<string, any>) => void

export interface CreateLoggerOptions {
  host: string
  headers?: Record<string, string>
  serviceName: string
  metadata?: Record<string, any>
}

export const createLogger = (
  options: CreateLoggerOptions
): Record<LogLevel, LogMethod> => {
  const winston = libWinston.createLogger({
    format: libWinston.format.combine(
      libWinston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      libWinston.format.printf(
        ({ timestamp, level, message }) =>
          `${timestamp} ${level.toUpperCase()}: ${message}`
      )
    ),
    transports: [
      new LokiTransport({
        host: options.host,
        headers: options.headers,
        labels: {
          service_name: options.serviceName,
          ...options.metadata,
        },
        json: true,
        batching: true,
        interval: 5,
        onConnectionError: err => console.error(err),
      }),
    ],
  })

  const logFactory =
    (logger: libWinston.Logger, level: LogLevel): LogMethod =>
    (message, fields) => {
      const child = logger.child({
        ...fields,
      })

      return child[level](message)
    }

  return {
    error: logFactory(winston, 'error'),
    warn: logFactory(winston, 'warn'),
    info: logFactory(winston, 'info'),
    http: logFactory(winston, 'http'),
    verbose: logFactory(winston, 'verbose'),
    debug: logFactory(winston, 'debug'),
    silly: logFactory(winston, 'silly'),
  }
}
