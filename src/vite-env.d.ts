/// <reference types="vite/client" />

interface ImportMeta {
  glob: <T = { default: unknown }>(
    pattern: string,
    options?: {
      eager?: boolean;
      import?: string;
      query?: string;
    },
  ) => Record<string, T>;
}
