import { verifyToken } from "../utils/auth";
import { Request, Response, NextFunction } from "express";
import Logger from "../utils/logger";
import { getRequestPath, getRequesterInfo } from "../utils/requests";
import UserController from "../controllers/User";

const authLogger = new Logger({ name: "Auth Middleware" });

export const checkToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const requesterInfo = getRequesterInfo(req);
    if (!token) {
      authLogger.warn(
        "No token provided",
        JSON.stringify(requesterInfo),
        JSON.stringify(getRequestPath(req))
      );
      return res.status(401).json({
        message: "No token provided",
      });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      // attempt to refresh token
      const refreshed = await UserController.refreshStatic({
        refreshToken: req.headers["x-refresh-token"] as string,
      });
      if (!refreshed) {
        authLogger.warn(
          "Invalid token",
          JSON.stringify(requesterInfo),
          JSON.stringify(getRequestPath(req))
        );
        return res.status(401).json({
          message: "Invalid token",
        });
      }
      req.body.decoded = await verifyToken(refreshed.accessToken);
      res.set({
        "x-refreshed": "true",
        "x-access-token": refreshed.accessToken,
        "x-refresh-token": refreshed.refreshToken,
      });
      return next();
    }
    req.body.decoded = decoded;
    next();
  } catch (error) {
    authLogger.error(
      error,
      JSON.stringify(getRequesterInfo(req)),
      JSON.stringify(getRequestPath(req))
    );
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const checkAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body.decoded;
    if (role !== "admin") {
      authLogger.warn(
        "Unauthorized access",
        JSON.stringify(getRequesterInfo(req)),
        JSON.stringify(getRequestPath(req))
      );
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }
    next();
  } catch (error) {
    authLogger.error(
      error,
      JSON.stringify(getRequesterInfo(req)),
      JSON.stringify(getRequestPath(req))
    );
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
