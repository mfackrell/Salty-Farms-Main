export type ApiSuccess<T> = { data: T; error: null };
export type ApiFailure = { data: null; error: { code: string; message: string } };

export const ok = <T>(data: T): ApiSuccess<T> => ({ data, error: null });
export const fail = (code: string, message: string): ApiFailure => ({
  data: null,
  error: { code, message }
});

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
