import fs from "fs";
import { parentPort, workerData } from "worker_threads";

const { filePath, tenantId } = workerData;

// 2. Heavy CPU Simulation + File Parsing
console.log(`[Worker Thread] Booting up for tenant: ${tenantId}...`);
console.log(`[Worker Thread] Beginning heavy data processing for: ${filePath}`);

try {
  let cpuBurner = 0;
  for (let i = 0; i < 2_000_000_000; i++) {
    cpuBurner += i;
  }
  // Get file stats to prove we accessed it
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  // 3. Send Success Message back to Main Thread

  if (parentPort) {
    parentPort.postMessage({
      status: "success",
      message: `File processed successfully. Simulated CPU load: ${cpuBurner}`,
      fileSizeMB: sizeInMB,
      tenantId,
    });
  }
} catch (error: any) {
  if (parentPort) {
    parentPort.postMessage({ status: "error", message: error.message });
  }
}
