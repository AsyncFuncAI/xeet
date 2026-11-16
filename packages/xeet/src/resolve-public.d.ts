import type { Post } from './types.js';
export declare function resolvePublicPost(url: string, options?: { origin?: string; signal?: AbortSignal }): Promise<{ post: Post; warnings: string[]; source?: { url: string; provider: string; fetchedAt: string } }>;
