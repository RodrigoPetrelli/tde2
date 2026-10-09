import request from 'supertest';
import { EventHandler } from '../../src/shared/application/EventBus';
import { InMemoryEventBus } from '../../src/shared/infrastructure/InMemoryEventBus';
import { PedidoCriado } from '../../src/modules/pedidos/domain/events/PedidoCriado';
import { createApp } from '../../src/main/app';
import { createContainer } from '../../src/main/container';

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Contrato HTTP', () => {
  const app = createApp();

  it('mantém /health, 404 de rota e 400 de JSON malformado', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
    await request(app).get('/api/inexistente').expect(404, { erro: 'Rota não encontrada' });
    await request(app)
      .post('/api/clientes')
      .set('Content-Type', 'application/json')
      .send('{malformado')
      .expect(400, { erro: 'JSON inválido no corpo da requisição' });
  });

  it('verifica o restaurante (404) antes do corpo do produto (400)', async () => {
    await request(app).post('/api/restaurantes/nao-existe/produtos').send({}).expect(404, { erro: 'Restaurante não encontrado' });
  });

  it('valida formato (400) antes de existência (404) ao criar pedido', async () => {
    const resposta = await request(app)
      .post('/api/pedidos')
      .send({ clienteId: 'x', restauranteId: 'y', itens: [{ produtoId: 'z', quantidade: 0 }] })
      .expect(400);
    expect(resposta.body).toEqual({ erro: 'A "quantidade" de cada item deve ser um inteiro maior que zero' });
  });

  it('rejeita e-mail duplicado com 422', async () => {
    await request(app).post('/api/clientes').send({ nome: 'Ana', email: 'ana@exemplo.com' }).expect(201);
    await request(app)
      .post('/api/clientes')
      .send({ nome: 'Ana 2', email: ' ANA@exemplo.com ' })
      .expect(422, { erro: 'Já existe um cliente cadastrado com este e-mail' });
  });

  it('confirma pedido e lista os pedidos do cliente', async () => {
    const r = await request(app).post('/api/restaurantes').send({ nome: 'R', categoria: 'C' });
    const p = await request(app).post(`/api/restaurantes/${r.body.id}/produtos`).send({ nome: 'P', precoCentavos: 1000 });
    const c = await request(app).post('/api/clientes').send({ nome: 'C', email: 'c@exemplo.com' });
    const pedido = await request(app)
      .post('/api/pedidos')
      .send({ clienteId: c.body.id, restauranteId: r.body.id, itens: [{ produtoId: p.body.id, quantidade: 1 }] })
      .expect(201);

    const confirmado = await request(app).patch(`/api/pedidos/${pedido.body.id}/confirmar`).expect(200);
    expect(confirmado.body.status).toBe('CONFIRMADO');
    await request(app).patch(`/api/pedidos/${pedido.body.id}/confirmar`).expect(422);

    const lista = await request(app).get(`/api/clientes/${c.body.id}/pedidos`).expect(200);
    expect(lista.body).toEqual([confirmado.body]);
  });
});

describe('Extensão por eventos (OCP)', () => {
  it('novos handlers reagem a PedidoCriado sem alterar o caso de uso', async () => {
    const eventBus = new InMemoryEventBus();
    const recebidos: PedidoCriado[] = [];
    const auditoria: EventHandler<PedidoCriado> = { handle: async (evento) => void recebidos.push(evento) };
    eventBus.assinar(PedidoCriado.NOME, auditoria);
    const app = createApp(createContainer({ eventBus }));

    const r = await request(app).post('/api/restaurantes').send({ nome: 'R', categoria: 'C' });
    const p = await request(app).post(`/api/restaurantes/${r.body.id}/produtos`).send({ nome: 'P', precoCentavos: 1000 });
    const c = await request(app).post('/api/clientes').send({ nome: 'C', email: 'c@exemplo.com' });
    const pedido = await request(app)
      .post('/api/pedidos')
      .send({ clienteId: c.body.id, restauranteId: r.body.id, itens: [{ produtoId: p.body.id, quantidade: 3 }] })
      .expect(201);

    expect(recebidos).toHaveLength(1);
    expect(recebidos[0]).toMatchObject({ pedidoId: pedido.body.id, totalCentavos: 3790 });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Notificação enviada ao restaurante "R"'));
  });
});
