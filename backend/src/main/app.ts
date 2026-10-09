import express, { Express } from 'express';
import { clientesModule } from '../modules/clientes/clientes.module';
import { pedidosModule } from '../modules/pedidos/pedidos.module';
import { restaurantesModule } from '../modules/restaurantes/restaurantes.module';
import { errorHandler, notFoundHandler } from '../shared/http/errorHandler';
import { Container, createContainer } from './container';

export function createApp(container: Container = createContainer()): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/api',
    restaurantesModule(container.restaurantes),
    clientesModule(container.clientes),
    pedidosModule(container.pedidos),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
