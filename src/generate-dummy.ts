import fs from "fs";
import path from "path";

const destPath = path.join(process.cwd(), "temp", "large_rag_test_file.txt");
const writeStream = fs.createWriteStream(destPath);

console.log("⏳ Generating large text file for RAG testing...");

const TOTAL_LINES = 1_000_000;
let currentLine = 0;

function writeStreamBackPreassure(): void {
  let canwrite = true;

  while (currentLine < TOTAL_LINES && canwrite) {
    const chunk = `Tenant_ID: uuid_123 | Line #${currentLine} | OmniDesk SaaS RAG system raw customer support log entry text for vector embedding testing.\n`;

    if (currentLine === TOTAL_LINES - 1) {
      writeStream.end(chunk);
    } else {
      canwrite = writeStream.write(chunk);
    }
    currentLine++;
  }
  if (currentLine < TOTAL_LINES) {
    writeStream.once("drain", writeStreamBackPreassure);
  }
}

writeStreamBackPreassure();

writeStream.on("finish", () => {
  const stats = fs.statSync(destPath);
  console.log(`✅ Success! File generated at: ${destPath}`);
  console.log(`📊 Total Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
});

writeStream.on("error", (err: Error) => {
  console.error("❌ Stream Error:", err);
});

// Loop chala kar dummy content write karenge
// 1 Million lines likhne par lagbhag 70-80MB ki file banegi. Aap loop badha sakte hain.
// for (let i = 0; i < 3_000_0000; i++) {
//   writeStream.write(
//     `Tenant_ID: uuid_123 | Line #${i} | OmniDesk SaaS RAG system raw customer support log entry text for vector embedding testing.\n`,
//   );
// }
