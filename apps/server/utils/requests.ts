import { Request } from "express";
import Logger from "./logger";

const requestLogger = new Logger({ name: "Request Utilities" });

export const getRequesterInfo = (req: Request) => {
  try {
    const ipaddress = req.headers["x-forwarded-for"] || req.ip;
    const language = req.headers["accept-language"];
    const software = req.headers["user-agent"];

    return {
      ipaddress,
      language,
      software,
    };
  } catch (error) {
    requestLogger.error(error);
    return undefined;
  }
};

export const getRequestPath = (req: Request) => {
  try {
    const { baseUrl, path, params, query } = req;
    return {
      baseUrl,
      path,
      params,
      query,
    };
  } catch (error) {
    requestLogger.error(error);
    return undefined;
  }
};
