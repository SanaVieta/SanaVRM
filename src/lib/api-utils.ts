import { ApiError } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";

export async function handleRequest<T>(
  cb: () => T | Promise<T>,
): Promise<NextResponse> {
  try {
    const result = await cb();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Request failed", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
