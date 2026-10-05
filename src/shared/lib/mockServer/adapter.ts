import axios, { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { useDemoMode } from '../demoMode';
import { useSessionStore } from '../session';
import { dispatch } from './handlers';
import { HttpError } from './utils';

/**
 * Axios adapter that decides per request: real backend or the in-memory mock server.
 *
 * - Demo mode on (header / login switch), or a session started on the mock → mock only, no network.
 * - Otherwise the real backend. If it can't be reached, or the endpoint isn't implemented there yet
 *   (404/405/501 on a route from docs/BACKEND_REQUIREMENTS.md), that request is answered by the mock.
 */

/** Endpoints the UI needs that are not in api.json yet. */
const NOT_IN_API: [string, RegExp][] = [
  ['GET', /^\/dashboard\/$/],
  ['*', /^\/notifications\//],
  ['*', /^\/audit-logs\//],
  ['*', /^\/settings\/$/],
  ['PATCH', /^\/auth\/me\/$/],
  ['POST', /^\/auth\/password-change\/$/],
  ['PATCH', /^\/tasks\/[^/]+\/comments\/[^/]+\/$/],
  ['GET', /^\/tasks\/[^/]+\/blockers\/$/],
  ['GET', /^\/projects\/[^/]+\/activity\/$/],
];

const LATENCY_MS = 180;

const pathOf = (config: InternalAxiosRequestConfig) => (config.url ?? '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '').split('?')[0];
const methodOf = (config: InternalAxiosRequestConfig) => (config.method ?? 'get').toUpperCase();
const tokenOf = (config: InternalAxiosRequestConfig) => String(config.headers?.Authorization ?? '').replace(/^Bearer\s+/, '') || undefined;

const isNotInApi = (method: string, path: string) => NOT_IN_API.some(([m, re]) => (m === '*' || m === method) && re.test(path));

const bodyOf = (data: unknown): Record<string, unknown> => {
  if (data instanceof FormData) return Object.fromEntries(data.entries());
  if (typeof data === 'string' && data) {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (data as Record<string, unknown>) ?? {};
};

/** Query string params (if any were baked into the URL) + `config.params`. */
const queryOf = (config: InternalAxiosRequestConfig) => {
  const fromUrl: Record<string, unknown> = {};
  new URLSearchParams((config.url ?? '').split('?')[1] ?? '').forEach((v, k) => {
    const prev = fromUrl[k];
    fromUrl[k] = prev === undefined ? v : [...(Array.isArray(prev) ? prev : [prev]), v];
  });
  return { ...fromUrl, ...(config.params as Record<string, unknown> | undefined) };
};

const respond = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  const method = methodOf(config);
  const path = pathOf(config);
  const base = { statusText: 'OK', headers: { 'x-mock': '1' }, config, request: {} };
  try {
    const result = dispatch({
      method, path, query: queryOf(config), body: bodyOf(config.data),
      token: tokenOf(config), fallbackUsername: useSessionStore.getState().user?.username,
    });
    if (!result) throw new HttpError(404, `Mock: no route for ${method} ${path}`);
    return { ...base, status: result.status, data: result.data };
  } catch (e) {
    if (!(e instanceof HttpError)) throw e;
    const response = { ...base, status: e.status, statusText: 'Error', data: e.body };
    throw new AxiosError(e.message, e.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, response);
  }
};

const realAdapter = axios.getAdapter(axios.defaults.adapter);

export const mockAwareAdapter: AxiosAdapter = async (config) => {
  const mockSession = tokenOf(config)?.startsWith('mock.') ?? false;
  if (useDemoMode.getState().enabled || mockSession) return respond(config);
  try {
    return await realAdapter(config);
  } catch (e) {
    if (!axios.isAxiosError(e)) throw e;
    const unreachable = !e.response && e.code !== AxiosError.ERR_CANCELED;
    const missing = !!e.response && [404, 405, 501].includes(e.response.status) && isNotInApi(methodOf(config), pathOf(config));
    if (!unreachable && !missing) throw e;
    useDemoMode.getState().markFallback();
    return respond(config);
  }
};
