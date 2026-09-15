export interface RuntimeSupabaseConfig {
  url: string;
  anonKey: string;
}

export function getRuntimeSupabaseConfig(): RuntimeSupabaseConfig | null {
  try {
    const raw = localStorage.getItem('vodacom_supabase_runtime_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

export function setRuntimeSupabaseConfig(config: RuntimeSupabaseConfig | null): void {
  try {
    if (config) {
      localStorage.setItem('vodacom_supabase_runtime_config', JSON.stringify(config));
    } else {
      localStorage.removeItem('vodacom_supabase_runtime_config');
    }
  } catch {
    // Ignore error
  }
}
