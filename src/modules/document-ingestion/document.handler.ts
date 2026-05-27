import path, { dirname } from "node:path";
import type { AppRequest, AppResponse } from "../../core/types/http.types.js";
import fs from "fs";
import { Worker } from "worker_threads";
import Busboy from "busboy";
import { fileURLToPath } from "node:url";

export async function handleDocumentUpload(
  req: AppRequest,
  res: AppResponse,
): Promise<void> {
  //   try {
  // without busboy(multer in express js) implimentation

  const tempDir = path.resolve(process.cwd(), "temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  // const fileName = `upload_${Date.now()}.txt`;
  // const filePath = path.join(tempDir, fileName);
  // const writeStream = fs.createWriteStream(filePath);

  // await pipeline(req, writeStream);

  // const stats = fs.statSync(filePath);

  // const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  // res.writeHead(200, { "content-type": "application/json" });
  // res.end(
  //   JSON.stringify({
  //     status: "success",
  //     message: "your file successfully streamed",
  //     fileName: `${fileName} filse size is: ${sizeInMB}`,
  //   }),
  // );
  //   } catch (error) {
  //     console.error("error", error);
  //     if (!res.headersSent) {
  //       res.writeHead(500, { "content-type": "application/json" });
  //       res.end(
  //         JSON.stringify({
  //           status: "error",
  //           message: "Internal server error",
  //         }),
  //       );
  //     }
  //   }

  // with busboy (multer in express) implimentation if file data have some unnesseary spaces and lines.

  const contentType = req.headers["content-type"] || "";
  let uploadedFilePath: string | null = null;
  if (!contentType.includes("multipart/form-data")) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        status: "error",
        message: {
          error:
            "Invalid Content-Type. Only multipart/form-data is allowed for RAG ingestion.",
        },
      }),
    );
    return;
  }

  const busboy = Busboy({ headers: req.headers });
  busboy.on("file", (fieldname, fileStream, info) => {
    const { filename, mimeType } = info;
    const savePath = `rag_tenant_data_${Date.now()}_${filename}`;
    const writeStream = fs.createWriteStream(savePath);
    fileStream.pipe(writeStream);
    writeStream.on("error", (err) => {
      console.error(`❌ [Disk Error] Failed to save ${filename}:`, err);
    });
    console.log(`[Busboy] Extracted file: ${filename} (${mimeType})`);
    uploadedFilePath = savePath;
  });

  busboy.on("close", () => {
    console.log(
      `✅ [RAG Gateway] File parsed and saved to disk. Zero memory bloat.`,
    );

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const workerPath = path.resolve(__dirname, "rag.worker.js");
    const parserWorker = new Worker(workerPath, {
      workerData: {
        filePath: uploadedFilePath,
        tenantId: "tenant_uuid_123",
      },
    });

    parserWorker.on("message", (result) => {
      if (result.status === "success") {
        console.log(
          `[Main Thread Alert] Worker finished successfully:`,
          result,
        );
      } else {
        console.error(
          `[Main Thread Alert] Worker reported failure:`,
          result.message,
        );
      }
    });

    parserWorker.on("error", (err: Error) => {
      console.error(`[Main Thread Alert] Worker crashed completely:`, err);
    });

    if (!res.headersSent) {
      res.writeHead(200, { "content-type": "applicaton/json" });
      res.end(
        JSON.stringify({
          status: "success",
          message: "File ingested successfully into OmniDesk pipeline.",
        }),
      );
    }
  });

  // use worker threads for embedding file

  busboy.on("error", (error: Error) => {
    console.error("error", error);

    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Internal Server Error during stream parsing.",
        }),
      );
    }
  });
  req.pipe(busboy);
}

// export async function handleDocumentUpload(
//   req: AppRequest,
//   res: AppResponse,
// ): Promise<void> {
//   try {
//     const tempDir = path.resolve(process.cwd(), "temp");

//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir, { recursive: true });
//     }

//     const fileName = `upload_${Date.now()}.txt`;
//     const filePath = path.join(tempDir, fileName);
//     const writeStream = fs.createWriteStream(filePath);

//     await pipeline(req, writeStream);

//     const stats = fs.statSync(filePath);

//     const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
//     console.log(`✅ Upload Complete! Saved ${sizeInMB} MB to ${fileName}.`);

//     res.writeHead(200, { "content-type": "application/json" });
//     res.end(
//       JSON.stringify({
//         status: "success",
//         message: "File streamed and save successfully",
//         fileSize: `${sizeInMB}Mb`,
//       }),
//     );
//   } catch (error) {
//     console.error(`❌ [Stream/Pipeline Error]:`, error);

//     if (!res.headersSent) {
//       res.writeHead(500, { "Content-Type": "application/json" });
//       res.end(
//         JSON.stringify({
//           status: "error",
//           message: "Internal Server Error during file pipeline.",
//         }),
//       );
//     }
//   }
// }

// no need with pipe line

// Note: this is manual code:

//   req.on("data", (chunk: Buffer) => {
//     chunkCount = chunk.length;
//     totalBytes += chunkCount;

//     // call fucntion
//     handleReadWriteStreams(chunk);
//     console.log(
//       `[RAG Ingestion] Processed Chunk #${chunkCount} | Size: ${chunk.length} bytes`,
//     );
//   });

//   req.on("end", () => {
//     const sizeInMb = (totalBytes / (1024 * 1024)).toFixed(2);
//     console.log(
//       `✅ Upload Complete! Total Size: ${sizeInMb} MB in ${chunkCount} chunks.`,
//     );
//     res.writeHead(200, { "content-type": "application/json" });
//     res.end(
//       JSON.stringify({
//         status: "success",
//         message: `File streamed successfully. Processed ${sizeInMb} MB.`,
//       }),
//     );
//     req.on("error", (error: Error) => {
//       console.error(`❌ [Stream Error]: ${error.message}`);
//       if (!res.headersSent) {
//         res.writeHead(500, { "content-type": "application/json" });
//         res.end(
//           JSON.stringify({
//             status: "error",
//             message: "Internal Server Error during file upload.",
//           }),
//         );
//       }
//     });
//   });
