import { config } from "./config";
import type { ScanResponse } from "./types";

export async function scanImageUri(uri: string): Promise<ScanResponse> {
  const formData = new FormData();
  formData.append("file", {
    uri,
    name: "scan.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const response = await fetch(`${config.apiUrl}/v1/scan`, {
    method: "POST",
    headers: {
      "X-API-Key": config.apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Scan failed (${response.status})`);
  }

  return response.json() as Promise<ScanResponse>;
}
