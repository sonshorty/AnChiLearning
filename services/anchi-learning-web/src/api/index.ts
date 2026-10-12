import type { ApiClient } from './types';
import { liveClient } from './client';
import { staticClient } from './staticClient';

export const api: ApiClient = import.meta.env.VITE_DEMO_MODE === 'true' ? staticClient : liveClient;
export type { ApiClient } from './types';