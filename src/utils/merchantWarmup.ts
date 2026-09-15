export interface WarmupOptions {
  campaignId: string;
  runId: string;
  baId: string;
  activityDate: string;
}

export function warmMerchantAgentWorkspace(options: WarmupOptions): void {
  // Pre-caches/preloads resources silently in background
  try {
    const key = `btl_warmup_${options.campaignId}_${options.runId}_${options.baId}`;
    sessionStorage.setItem(key, options.activityDate);
  } catch {
    // Ignore storage quota
  }
}
