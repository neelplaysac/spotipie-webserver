import { Request, Response, NextFunction } from "express";
import { authService } from "../models/auth";
import { BOT_URL } from "../util/secrets";
import logger from "../util/logging";

const getClientIp = (req: Request) => req.ip ?? "unknown";

export const callbackRoute = async (req: Request, res: Response, next: NextFunction) => {
  const botUrl = BOT_URL;

  logger.log({
    level: "info",
    message: "Callback route accessed",
    data: { query: req.query, ip: getClientIp(req) },
  });

  try {
    if (req.query.error) {
      logger.log({
        level: "warn",
        message: "OAuth callback cancelled by user",
        data: { error: req.query.error, ip: getClientIp(req) },
      });
      return res.send("Cancelled");
    }

    const userIp = getClientIp(req);
    const authCode = req.query.code as string;

    logger.log({
      level: "info",
      message: "Processing auth code for user",
      data: { ip: userIp, hasCode: !!authCode },
    });

    const code = await authService.findOneAndUpdate(userIp, authCode);

    if (!code) {
      logger.log({
        level: "error",
        message: "Failed to save auth code",
        data: { ip: userIp },
      });
      return res.status(500).json({ error: "Failed to save auth code" });
    }

    logger.log({
      level: "info",
      message: "Auth code saved successfully",
      data: { ip: userIp, codeId: code._id },
    });

    const redirectUrl = `https://${botUrl}${code._id}`;
    logger.log({
      level: "info",
      message: "Redirecting user to bot",
      data: { ip: userIp, redirectUrl },
    });

    res.redirect(redirectUrl);
  } catch (err: any) {
    logger.log({
      level: "error",
      message: "Error in callback route",
      data: { error: err.message, stack: err.stack, ip: getClientIp(req) },
    });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const homeRoute = async (req: Request, res: Response, next: NextFunction) => {
  logger.log({
    level: "info",
    message: "Home route accessed",
    data: { ip: getClientIp(req) },
  });

  res.status(200).send("Welcome to spotipie authserver");
};
