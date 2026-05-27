import express from "express";
import type { Request, Response } from "express";
// import * as http from "http";
// import type { AppRequest, AppResponse } from "./core/types/http.types.js";
import { handleDocumentUpload } from "./modules/document-ingestion/document.handler.js";
import { requireAuth } from "./core/middlewares/auth.middleware.js";
import type { AuthRequest } from "./core/types/auth.types.js";
import { loginUser } from "./modules/auth/controller/auth.controller.js";
import { globalErrorHandling } from "./core/middlewares/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get("health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "UP", message: "OmniDesk SaaS Gateway Active" });
});

app.post("/api/v1/auth/login", loginUser);
app.use(globalErrorHandling);

app.post(
  "/api/v1/documents/upload",
  requireAuth,
  (req: Request, res: Response) => {
    handleDocumentUpload(req as AuthRequest, res);
  },
);

app.listen(PORT, () => {
  console.log(`[🚀 OmniDesk SaaS] API Gateway running on port ${PORT}`);
});

// const server = http.createServer((req: AppRequest, res: AppResponse) => {
//   res.setHeader("Content-Type", "application/json");
//   if (req.url == "/api/v1/documents/upload" && req.method === "POST") {
//     return handleDocumentUpload(req, res);
//   }

//   req.statusCode === 404;
//   res.end(JSON.stringify({ error: "Route not found" }));
// });

// server.listen(port, () => {
//   console.log(`server listing port: ${port}`);
// });
