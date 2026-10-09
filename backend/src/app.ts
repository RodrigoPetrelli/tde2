import express, { NextFunction, Request, Response } from 'express';
import { router } from './routes';

export const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento genérico de erros (ex.: JSON malformado no corpo da requisição)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError) {
    res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});
