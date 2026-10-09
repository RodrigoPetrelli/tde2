/** Requisição HTTP já desacoplada do framework. */
export interface HttpRequest {
  readonly params: Readonly<Record<string, string>>;
  readonly body: Readonly<Record<string, unknown>>;
}

export interface HttpResponse {
  readonly statusCode: number;
  readonly body: unknown;
}

/** Controller: traduz HTTP <-> caso de uso, sem regra de negócio. */
export interface HttpController {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Rota declarada por uma fatia (feature). */
export interface HttpRoute {
  readonly method: HttpMethod;
  readonly path: string;
  readonly controller: HttpController;
}

export const ok = (body: unknown): HttpResponse => ({ statusCode: 200, body });
export const created = (body: unknown): HttpResponse => ({ statusCode: 201, body });
