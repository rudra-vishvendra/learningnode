import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../core/middlewares/error.middleware.js";
import { AuthService } from "../services/auth.service.js";
import { config } from "../../../core/config/env.config.js";

const authService = new AuthService();

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authService = new AuthService();
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new AppError("Missing required fields: email and password.", 400),
      );
    }
    const user = await authService.validateCredentials(email, password);
    const { accessToken, refreshToken } = authService.generateTokenPair(user);
    const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: cookieMaxAge,
    });
    res.status(200).json({
      status: "success",
      message: "Authentication successful.",
      data: {
        accessToken: accessToken,
        userProfile: user,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const refreshAccesToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      return next(
        new AppError("Access Denied. No refresh token provided.", 401),
      );
    }

    const { accessToken, refreshToken } =
      authService.refreshAccesToken(oldRefreshToken);

    const cookieMaxAge = 7 * 24 * 60 * 60 * 1000;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: cookieMaxAge,
    });

    res.status(200).json({
      status: "success",
      message: "Tokens successfully rotated.",
      data: {
        accessToken: accessToken,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};
