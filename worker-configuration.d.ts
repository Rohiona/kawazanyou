declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
    DB: D1Database;
    IMPORT_CLAIM_TOKEN?: string;
    KAWAZANYOU_LOCAL_AUTH_ENABLED?: string;
    KAWAZANYOU_LOCAL_USER_EMAIL?: string;
    KAWAZANYOU_LOCAL_USER_FULL_NAME?: string;
    IMAGES: {
      input(stream: ReadableStream): {
        transform(options: Record<string, unknown>): {
          output(options: {
            format: string;
            quality: number;
          }): Promise<{ response(): Response }>;
        };
      };
    };
  }
}
