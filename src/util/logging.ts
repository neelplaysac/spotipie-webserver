import winston from "winston";

const options: winston.LoggerOptions = {
  level: "error",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logfile.log", level: "info" }),
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(winston.format.colorize(), winston.format.prettyPrint()),
    }),
  ],
  exceptionHandlers: [new winston.transports.File({ filename: "exceptions.log" })],
  exitOnError: false,
};

const logger = winston.createLogger(options);

export default logger;
