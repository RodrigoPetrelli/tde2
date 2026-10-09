import { NextFunction, Request, Response } from 'express';
import { BusinessRuleError, NotFoundError, ValidationError } from '../domain/errors';

/** Mapeia erros para respostas `{ erro: mensagem }`: 400 validação, 404 não encontrado, 422 regra de negócio. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ erro: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ erro: err.message });
    return;
  }
  if (err instanceof BusinessRuleError) {
    res.status(422).json({ erro: err.message });
    return;
  }
  // JSON malformado no corpo da requisição (lançado pelo express.json()).
  if (err instanceof SyntaxError) {
    res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}

/** Resposta padrão para rotas inexistentes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ erro: 'Rota não encontrada' });
}
