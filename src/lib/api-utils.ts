import { ApiError } from "next/dist/server/api-utils";
import { type NextRequest, NextResponse } from "next/server";
import { type output, prettifyError, type ZodType } from "zod";

function getHttpStatus(request: NextRequest): number {
  const methodMap: Record<string, number> = {
    GET: 200,
    POST: 201,
    PUT: 200,
    PATCH: 200,
    DELETE: 204,
  };
  return methodMap[request.method] ?? 200;
}

export async function getRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError(400, "Invalid JSON body");
    }
    throw error;
  }
}

/**
 * Runs a route callback and returns its result as a `NextResponse`.
 *
 * Success status comes from `request.method` unless `status` is passed:
 * GET, PUT, and PATCH return 200, POST returns 201, and DELETE returns 204
 * with an empty body.
 *
 * Pass `validation` to parse `body` with the Zod schema before calling `cb`.
 * The callback then receives the parsed value. A failed parse returns 400
 * and does not call `cb`. `body` may be a function (sync or async); it is
 * called inside the error handling, so pass `() => getRequestBody(request)`
 * to turn an unreadable body into a 400.
 *
 * Throw `ApiError` from `cb` for an expected failure. The response is
 * `{ error: message }` with that status code. Any other thrown error is
 * logged and returned as `{ error: "Internal Server Error" }` with status 500.
 *
 * @param cb Handler invoked after validation. It may be sync or async.
 * @param request Incoming request. Its method selects the success status.
 * @param validation Schema and raw value to parse before `cb` runs.
 * @param status Success status that overrides the method default.
 * @returns A `NextResponse` with the result or error.
 */
export function handleRequest<T>(
  cb: () => T | Promise<T>,
  request: NextRequest,
): Promise<NextResponse>;
export function handleRequest<S extends ZodType, T>(
  cb: (body: output<S>) => T | Promise<T>,
  request: NextRequest,
  validation: { schema: S; body: unknown },
  status?: number,
): Promise<NextResponse>;
export async function handleRequest<S extends ZodType, T>(
  cb: (body?: output<S>) => T | Promise<T>,
  request: NextRequest,
  validation?: { schema: S; body: unknown },
  status?: number,
): Promise<NextResponse> {
  try {
    let parsedBody: output<S> | undefined;
    if (validation) {
      const rawBody =
        typeof validation.body === "function"
          ? await validation.body()
          : validation.body;
      const parsed = await validation.schema.safeParseAsync(rawBody);
      if (!parsed.success) {
        throw new ApiError(400, prettifyError(parsed.error));
      }
      parsedBody = parsed.data;
    }
    const httpStatus = status ? status : getHttpStatus(request);
    const result = await cb(parsedBody);
    if (httpStatus === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error("Request failed", error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
