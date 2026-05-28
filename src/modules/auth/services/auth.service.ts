// import type { TokenPayload } from "../../../core/types/auth.types.js";
// import { config } from "../../../core/config/env.config.js";

// import jwt from "jsonwebtoken";
// import { AppError } from "../../../core/middlewares/error.middleware.js";

// export class AuthService {
//   public generateTokenPair(payload: TokenPayload): {
//     accessToken: string;
//     refreshToken: string;
//   } {
//     try {
//       const accessToken = jwt.sign(payload, config.JWT_SECRET, {
//         expiresIn: config.JWT_ACCESS_EXPIRES_IN,
//       });
//       const refreshToken = jwt.sign(payload, config.JWT_SECRET, {
//         expiresIn: config.JWT_REFRESH_EXPIRES_IN,
//       });
//       return { accessToken, refreshToken };
//     } catch (error) {
//       throw new AppError("Failed to generate secure tokens.", 500);
//     }
//   }

//   public validateCredentials(email: string, password: string) {
//     if (
//       email === "admin@ominidesk.com" &&
//       password === "SuperSecurePassword123!"
//     ) {
//       return {
//         tenantId: "tenant_enterprise_001",
//         userId: "user_999",
//         role: "admin",
//       };
//     }
//     throw new AppError("Invalid email or password.", 401);
//   }
// }

// src/modules/auth/auth.service.ts
import jwt, { type JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt"; // IMPORT BCRYPT
import { config } from "../../../core/config/env.config.js";
import { AppError } from "../../../core/middlewares/error.middleware.js";

export interface TokenPayload {
  tenantId: string;
  userId: string;
  role: string;
}

// 1. THIS IS OUR "DATABASE" NOW. Notice the password is a BCRYPT HASH!
// Password is: "SuperSecurePassword123!"
const mockUserDatabase = {
  email: "admin@omnidesk.com",
  passwordHash: "$2b$10$wT8K5P9x9.mE/8uP6zS2/.0OQh1sM76XgQZ6gJ4FqJ3/hM6Lz8/tK",
  tenantId: "tenant_enterprise_001",
  userId: "user_999",
  role: "admin",
};

export class AuthService {
  public generateTokenPair(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      const accessToken = jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_ACCESS_EXPIRES_IN,
      });
      const refreshToken = jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new AppError("Failed to generate secure tokens.", 500);
    }
  }

  public async validateCredentials(
    email: string,
    password: string,
  ): Promise<TokenPayload> {
    // 2. Check if user exists in DB
    if (email !== mockUserDatabase.email) {
      throw new AppError("Invalid email or password.", 401);
    }

    // 3. ARCHITECT'S WAY: Compare the plain-text password with the HASHED password in DB!
    // bcrypt.compare() is an async function because hashing is intentionally slow to prevent brute-force attacks.
    const isPasswordValid = await bcrypt.compare(
      password,
      mockUserDatabase.passwordHash,
    );

    console.log(isPasswordValid, "isPasswordValid");

    if (!isPasswordValid) {
      // We use the exact same error message to avoid "User Enumeration" attacks
      throw new AppError("Invalid email or password.", 401);
    }

    // 4. Success! Return the payload
    return {
      tenantId: mockUserDatabase.tenantId,
      userId: mockUserDatabase.userId,
      role: mockUserDatabase.role,
    };
  }

  public refreshAccesToken(oldRrefreshToken: string): {
    accessToken: string;
    refreshToken: string;
  } {
    try {
      const decode = jwt.verify(
        oldRrefreshToken,
        config.JWT_SECRET,
      ) as JwtPayload & TokenPayload;

      const cleanPayload: TokenPayload = {
        tenantId: decode.tenantId,
        userId: decode.userId,
        role: decode.role,
      };

      return this.generateTokenPair(cleanPayload);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Refresh token expired. Please log in again.", 403);
      }
      throw new AppError("Invalid refresh token.", 403);
    }
  }
}
