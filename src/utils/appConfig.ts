export interface RuntimeGoogleSheetsConfig {
  appScriptUrl: string;
  sheetUrl?: string;
}

export function getRuntimeGoogleSheetsConfig(): RuntimeGoogleSheetsConfig | null {
  try {
    const raw = localStorage.getItem('rida_google_sheets_runtime_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.appScriptUrl) return parsed;
    }
  } catch {}
  return null;
}

export function setRuntimeGoogleSheetsConfig(config: RuntimeGoogleSheetsConfig | null): void {
  try {
    if (config) localStorage.setItem('rida_google_sheets_runtime_config', JSON.stringify(config));
    else localStorage.removeItem('rida_google_sheets_runtime_config');
  } catch {}
}
