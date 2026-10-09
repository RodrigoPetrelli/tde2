import { RequestHandler, Router } from 'express';
import { asyncHandler } from './asyncHandler';
import { HttpController, HttpRoute } from './HttpController';

/** Router HTTP montado por cada módulo (isola os módulos do tipo concreto do Express). */
export type HttpRouter = Router;

function comoRegistro(body: unknown): Readonly<Record<string, unknown>> {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
}

/** Converte um HttpController em um handler do Express. */
export function adaptarController(controller: HttpController): RequestHandler {
  return asyncHandler(async (req, res) => {
    const resposta = await controller.handle({ params: req.params, body: comoRegistro(req.body) });
    res.status(resposta.statusCode).json(resposta.body);
  });
}

/** Monta um Router do Express a partir das rotas declaradas pelas fatias de um módulo. */
export function montarRouter(rotas: readonly HttpRoute[]): HttpRouter {
  const router = Router();
  for (const rota of rotas) {
    router[rota.method](rota.path, adaptarController(rota.controller));
  }
  return router;
}
