import { realApi } from './realApi';
import { mockApi } from './mock/mockApi';

export const USE_MOCK = String(process.env.VITE_USE_MOCK) !== 'false';

/**
 * Ponto unico de acesso a API.
 * VITE_USE_MOCK=true  -> dados em memoria (frontend roda sem backend)
 * VITE_USE_MOCK=false -> backend Spring Boot em VITE_API_URL
 */
export const api = USE_MOCK ? mockApi : realApi;

export { ApiError } from './http';
export { resetMockDb } from './mock/mockApi';
