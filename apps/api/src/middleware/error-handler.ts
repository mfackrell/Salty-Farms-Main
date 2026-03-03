import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, fail } from '../types/api.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json(fail('VALIDATION_ERROR', err.issues.map((i) => i.message).join(', ')));
  }

  if (err instanceof AppError) {
    return res.status(err.status).json(fail(err.code, err.message));
  }

  return res.status(500).json(fail('INTERNAL_ERROR', 'Something went wrong'));
}
