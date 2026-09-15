export interface BackgroundOperationOptions<T = any> {
  queued?: string;
  success?: string;
  onSuccess?: (result: T) => void;
  onError?: (error: any) => void;
}

export function runInBackground<T = any>(
  label: string,
  task: () => Promise<T> | T,
  options?: BackgroundOperationOptions<T>
): Promise<T | void> {
  return Promise.resolve()
    .then(() => task())
    .then((res) => {
      options?.onSuccess?.(res);
      return res;
    })
    .catch((err) => {
      console.warn(`[BackgroundOperation] "${label}" failed:`, err);
      options?.onError?.(err);
    });
}
