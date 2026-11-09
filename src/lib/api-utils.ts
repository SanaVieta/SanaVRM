import { ApiError } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";
import { type output, prettifyError, type ZodType } from "zod";

export function handleRequest<T>(
  cb: () => T | Promise<T>,
): Promise<NextResponse>;
export function handleRequest<S extends ZodType, T>(
  cb: (body: output<S>) => T | Promise<T>,
  validation: { schema: S; body: unknown },
): Promise<NextResponse>;
export async function handleRequest<S extends ZodType, T>(
  cb: (body?: output<S>) => T | Promise<T>,
  validation?: { schema: S; body: unknown },
): Promise<NextResponse> {
  try {
    let parsedBody: output<S> | undefined;
    if (validation) {
      const parsed = await validation.schema.safeParseAsync(validation.body);
      if (!parsed.success) {
        throw new ApiError(400, prettifyError(parsed.error));
      }
      parsedBody = parsed.data;
    }
    return NextResponse.json(await cb(parsedBody));
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
