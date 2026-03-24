import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; data: null; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(error: string, status = 400): NextResponse<ApiFailure> {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export function serverError(message = "Internal server error"): NextResponse<ApiFailure> {
  return NextResponse.json({ success: false, data: null, error: message }, { status: 500 });
}
