import winston from "winston";
import fs from "fs";
import path from "path";
import { ENVIRONMENT } from "./secrets";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Determine log level based on environment
const getLogLevel = (): string => {
  if (ENVIRONMENT === "production") {
    return process.env.LOG_LEVEL || "info";
  }
  return process.env.LOG_LEVEL || "debug";
};

// Custom format for errors with stack traces
const errorFormat = winston.format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
      name: info.name,
    };
  }
  if (info.error instanceof Error) {
    return {
      ...info,
      error: {
        message: info.error.message,
        stack: info.error.stack,
        name: info.error.name,
      },
    };
  }
  return info;
});

// Simple readable format for console (works in both dev and prod)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, requestId, context, ...meta }) => {
    const requestIdStr = requestId ? `[${requestId}]` : "";
    const contextStr = context ? `[${context}]` : "";
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${requestIdStr}${contextStr} ${level}: ${message}${metaStr}`;
  })
);

// JSON format for file logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  errorFormat(),
  winston.format.json()
);

const transports: winston.transport[] = [
  // Error log file - only errors
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined log file - all logs
  new winston.transports.File({
    filename: "logs/combined.log",
    level: "info",
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Console transport - readable format for all environments
transports.push(
  new winston.transports.Console({
    level: getLogLevel(),
    format: consoleFormat,
  })
);

const logger = winston.createLogger({
  level: getLogLevel(),
  format: jsonFormat,
  defaultMeta: {
    service: "spotipie-webserver",
    environment: ENVIRONMENT || "development",
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
      format: jsonFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
      format: jsonFormat,
    }),
  ],
  exitOnError: false,
});

// Helper function to create a child logger with request ID
export const createRequestLogger = (requestId: string, additionalMeta?: Record<string, any>) => {
  return logger.child({
    requestId,
    ...additionalMeta,
  });
};

// Helper function for logging errors with full context
export const logError = (
  loggerInstance: winston.Logger,
  error: Error | unknown,
  context?: Record<string, any>
) => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  loggerInstance.error({
    message: errorObj.message,
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    ...context,
  });
};

export default logger;
