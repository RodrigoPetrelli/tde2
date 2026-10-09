import request from 'supertest';
import { app } from '../src/app';

describe('Fluxo de pedidos', () => {
  it('cria restaurante, produto, cliente, pedido e cancela o pedido', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const restaurante = await request(app)
      .post('/api/restaurantes')
      .send({ nome: 'Cantina da Nona', categoria: 'Italiana' })
      .expect(201);
    expect(restaurante.body.id).toEqual(expect.any(String));

    const produto = await request(app)
      .post(`/api/restaurantes/${restaurante.body.id}/produtos`)
      .send({ nome: 'Lasanha', precoCentavos: 3500, disponivel: true })
      .expect(201);
    expect(produto.body.precoCentavos).toBe(3500);

    const cliente = await request(app)
      .post('/api/clientes')
      .send({ nome: 'Maria', email: 'maria@exemplo.com' })
      .expect(201);

    const pedido = await request(app)
      .post('/api/pedidos')
      .send({
        clienteId: cliente.body.id,
        restauranteId: restaurante.body.id,
        itens: [{ produtoId: produto.body.id, quantidade: 2 }],
      })
      .expect(201);

    expect(pedido.body.status).toBe('CRIADO');
    expect(pedido.body.taxaEntregaCentavos).toBe(790);
    expect(pedido.body.totalCentavos).toBe(2 * 3500 + 790);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Notificação enviada ao restaurante'));

    const cancelado = await request(app).patch(`/api/pedidos/${pedido.body.id}/cancelar`).expect(200);
    expect(cancelado.body.status).toBe('CANCELADO');

    const cancelarDeNovo = await request(app).patch(`/api/pedidos/${pedido.body.id}/cancelar`).expect(422);
    expect(cancelarDeNovo.body).toEqual({ erro: expect.any(String) });
  });
});
