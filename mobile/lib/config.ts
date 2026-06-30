export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
  apiKey: process.env.EXPO_PUBLIC_API_KEY ?? "dev-key-change-me",
  cloudScanIntervalMs: 3500,
  minCloudScanIntervalMs: 3000,
  localProcessEveryNthFrame: 3,
  cloudUploadMaxEdge: 960,
  cloudUploadQuality: 0.72,
};
