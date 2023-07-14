import jwt, { SignOptions } from "jsonwebtoken";
import { hashSync, compareSync } from "bcrypt";
import Logger from "./logger";
import { config } from "dotenv";

config();

const tokenSecret = process.env.TOKEN_SECRET;

const jwtLogger = new Logger({ name: "JWT" });

export const generateToken = async (payload: any, options?: SignOptions) => {
  try {
    return jwt.sign(payload, tokenSecret as string, {
      expiresIn: "1h",
      ...options,
    });
  } catch (error) {
    jwtLogger.error(error);
    return undefined;
  }
};

export async function verifyToken<T>(token: string) {
  try {
    return jwt.verify(token, tokenSecret as string) as T;
  } catch (error) {
    jwtLogger.error(error);
    return undefined;
  }
}

export const hashPassword = async (password: string) => {
  try {
    return hashSync(password, 10);
  } catch (error) {
    jwtLogger.error(error);
    return undefined;
  }
};

export const comparePassword = async (password: string, hash: string) => {
  try {
    return compareSync(password, hash);
  } catch (error) {
    jwtLogger.error(error);
    return undefined;
  }
};
