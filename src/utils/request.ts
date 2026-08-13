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

/**
 * Thrown when a 2xx response isn't the JSON the caller expected.
 *
 * Deliberately not an `ApiError`: that one means "the API answered, and said
 * no". This means nothing resembling the API answered at all. The usual cause
 * is a base URL pointing somewhere that serves an SPA fallback, which hands
 * back `200 text/html` for every path including ones the API never had.
 *
 * The message names the URL and content type, since the reader is whoever
 * misconfigured the base URL. The undecodable body goes on `cause` rather than
 * a field of its own, so it is there in the console without inventing a second
 * place to look. Nothing shows this text to a user: both containers map it to
 * "couldn't reach the server", which is what happened from their side.
 */
export class InvalidJsonError extends Error {
  constructor(res: Response, body: string) {
    const contentType = res.headers.get('content-type') ?? 'no content type';
    super(
      `Expected JSON from ${res.url} but got ${contentType} (status ${res.status})`,
      { cause: body },
    );
    this.name = 'InvalidJsonError';
  }
}

/** The `{ message, field }` envelope the API serialises every refusal as. */
interface ApiErrorBody {
  message?: unknown;
  field?: unknown;
}

/**
 * Pulls that envelope off a thrown error, so the shape of an API failure is
 * described here, next to the type that carries it, rather than re-derived by
 * each container that has to display one.
 *
 * Both parts are optional on purpose. A proxy answering with HTML gives a
 * string body and no field, and callers supply their own wording when the
 * message comes back empty, since only they know what the user was trying.
 */
export function apiErrorDetail(error: unknown): {
  message: string;
  field?: string;
} {
  if (!(error instanceof ApiError)) return { message: '' };

  const { body } = error;
  if (typeof body === 'string') return { message: body };
  if (!body || typeof body !== 'object') return { message: '' };

  const { message, field } = body as ApiErrorBody;
  return {
    message: typeof message === 'string' ? message.trim() : '',
    field: typeof field === 'string' ? field : undefined,
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestParams extends Omit<RequestInit, 'method'> {
  method: HttpMethod;
}

/**
 * Reads a response body once and reports whether it was JSON.
 *
 * Both the success and the failure path need the same three steps, and they
 * disagree only about what an unparseable body means: a thrown error on the
 * way in, a diagnostic string on the way out. Deciding "how a body is decoded"
 * here keeps that one decision from drifting between the two.
 *
 * `res.text()` rather than `res.json()` because a failed `res.json()` consumes
 * the stream and takes the text with it, leaving nothing to report.
 *
 * @param res A response from a network request
 * @returns The raw text, the parsed value when it parsed, and which happened
 */
async function decodeBody(
  res: Response,
): Promise<{ text: string; parsed: unknown; isJson: boolean }> {
  const text = await res.text();
  if (!text) return { text, parsed: null, isJson: false };

  try {
    return { text, parsed: JSON.parse(text) as unknown, isJson: true };
  } catch {
    return { text, parsed: null, isJson: false };
  }
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

  const { text, parsed, isJson } = await decodeBody(res);
  if (!text) return null as T;
  if (!isJson) throw new InvalidJsonError(res, text);

  return parsed as T;
}

/**
 * Error bodies are usually JSON, but a proxy or load balancer in front of the
 * API may answer with HTML or plain text, so read once and decide after.
 *
 * @param res A failed response
 * @returns The parsed body, the raw text, or `null` when there is no body
 */
async function readErrorBody(res: Response): Promise<unknown> {
  const { text, parsed, isJson } = await decodeBody(res);
  if (!text) return null;

  return isJson ? parsed : text;
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
