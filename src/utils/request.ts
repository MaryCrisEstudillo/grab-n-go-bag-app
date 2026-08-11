/**
 * Every network call goes through here: one place that knows how a response
 * becomes data, and how a failure becomes a thrown error. Gateways describe
 * *what* to call; this module owns *how* the call is made.
 */

/**
 * Thrown for any non-2xx response. `body` is whatever the server sent back —
 * parsed JSON when it is JSON, the raw text when it is not, `null` when empty.
 */
export class ApiError extends Error {
  readonly status: number;

  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestParams extends Omit<RequestInit, 'method'> {
  method: HttpMethod;
}

/**
 * Parses the JSON returned by a network request.
 *
 * @param res A response from a network request
 * @returns The parsed JSON, or `null` for the statuses that carry no body
 */
async function parseJSON<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.status === 205) {
    // Callers of body-less endpoints declare `T` as `null`.
    return null as T;
  }
  return (await res.json()) as T;
}

/**
 * Error bodies are usually JSON, but a proxy or load balancer in front of the
 * API may answer with HTML or plain text, so read once and decide after.
 *
 * @param res A failed response
 * @returns The parsed body, the raw text, or `null` when there is no body
 */
async function readErrorBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Checks if a network request came back fine, and throws an error if not.
 *
 * @param res A response from a network request
 * @returns The response, or throws `ApiError`
 */
async function checkStatus(res: Response): Promise<Response> {
  if (res.status >= 200 && res.status < 300) {
    return res;
  }
  throw new ApiError(res.status, await readErrorBody(res));
}

/**
 * Requests a URL, returning the response headers alongside the data. Use it
 * when the interesting part is in a header — pagination totals, for instance.
 *
 * @param url The URL we want to request
 * @param options The options we want to pass to "fetch"
 * @returns The response headers and response data
 */
export async function requestWithResponseHeaders<T>(
  url: string,
  options: RequestParams,
): Promise<[Headers, T]> {
  const res = await checkStatus(await fetch(url, options));
  return [res.headers, await parseJSON<T>(res)];
}

/**
 * Requests a URL, returning a promise.
 *
 * @param url The URL we want to request
 * @param options The options we want to pass to "fetch"
 * @returns The response data
 */
export default async function request<T>(
  url: string,
  options: RequestParams,
): Promise<T> {
  const res = await checkStatus(await fetch(url, options));
  return parseJSON<T>(res);
}
