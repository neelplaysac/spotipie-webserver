import { Request, Response, NextFunction } from "express";
import { authService } from "../models/auth";
import { BOT_URL } from "../util/secrets";
import logger, { logError } from "../util/logging";

const getClientIp = (req: Request) => req.ip ?? "unknown";

export const callbackRoute = async (req: Request, res: Response, next: NextFunction) => {
  const requestLogger = req.logger || logger;
  const botUrl = BOT_URL;
  const userIp = getClientIp(req);

  requestLogger.info("Callback route accessed", {
    context: "callback_route",
    ip: userIp,
    hasError: !!req.query.error,
    hasCode: !!req.query.code,
  });

  try {
    if (req.query.error) {
      requestLogger.warn("OAuth callback cancelled by user", {
        context: "callback_route",
        error: req.query.error,
        ip: userIp,
      });
      return res.send("Cancelled");
    }

    const authCode = req.query.code as string;

    if (!authCode) {
      requestLogger.warn("Callback route accessed without auth code", {
        context: "callback_route",
        ip: userIp,
      });
      return res.status(400).json({ error: "Missing auth code" });
    }

    requestLogger.info("Processing auth code", {
      context: "callback_route",
      ip: userIp,
    });

    const code = await authService.findOneAndUpdate(userIp, authCode);

    if (!code) {
      requestLogger.error("Failed to save auth code to database", {
        context: "callback_route",
        ip: userIp,
        action: "save_auth_code",
      });
      return res.status(500).json({ error: "Failed to save auth code" });
    }

    requestLogger.info("Auth code saved successfully", {
      context: "callback_route",
      ip: userIp,
      codeId: code._id,
    });

    const redirectUrl = `https://${botUrl}${code._id}`;
    requestLogger.info("Redirecting user to bot", {
      context: "callback_route",
      ip: userIp,
      redirectUrl,
    });

    res.redirect(redirectUrl);
  } catch (err: unknown) {
    logError(requestLogger, err, {
      context: "callback_route",
      ip: userIp,
      action: "process_callback",
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const homeRoute = async (req: Request, res: Response, next: NextFunction) => {
  const requestLogger = req.logger || logger;
  requestLogger.info("Home route accessed", {
    context: "home_route",
    ip: getClientIp(req),
  });

  res.status(200).send("Welcome to spotipie authserver");
};
