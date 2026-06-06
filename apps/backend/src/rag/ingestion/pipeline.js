import { ingestResume } from "./resumeIngester.js";
import { ingestGitHub } from "./githubIngester.js";

export async function runIngestion({
  resumePath,
  githubUsername,
  githubToken,
}) {
  let total = 0;

  if (resumePath) {
    console.log("Ingesting resume...");
    total += await ingestResume(resumePath);
    console.log("Resume ingestion complete.");
  }

  if (githubUsername) {
    console.log("Ingesting GitHub repositories...");
    total += await ingestGitHub(githubUsername, githubToken);
    console.log("GitHub ingestion complete.");
  }

  return total;
}
