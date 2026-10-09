import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Encaminha rejeições de handlers assíncronos para o errorHandler (Express 4 não faz isso sozinho). */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
