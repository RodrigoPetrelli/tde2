import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db, ItemPedido, Pedido } from './db';

// Versão inicial "tudo junto": validação, regra de negócio e acesso a dados
// ficam dentro dos próprios handlers.

export const router = Router();

const TAXA_ENTREGA_CENTAVOS = 790; // R$ 7,90

// ---------------------------------------------------------------------------
// Restaurantes
// ---------------------------------------------------------------------------

router.post('/restaurantes', (req, res) => {
  const { nome, categoria } = req.body ?? {};

  if (typeof nome !== 'string' || nome.trim() === '') {
    res.status(400).json({ erro: 'O campo "nome" é obrigatório' });
    return;
  }
  if (typeof categoria !== 'string' || categoria.trim() === '') {
    res.status(400).json({ erro: 'O campo "categoria" é obrigatório' });
    return;
  }

  const restaurante = {
    id: randomUUID(),
    nome: nome.trim(),
    categoria: categoria.trim(),
    criadoEm: new Date().toISOString(),
  };
  db.restaurantes.push(restaurante);

  res.status(201).json(restaurante);
});

router.get('/restaurantes', (_req, res) => {
  res.json(db.restaurantes);
});

// ---------------------------------------------------------------------------
// Produtos do cardápio
// ---------------------------------------------------------------------------

router.post('/restaurantes/:id/produtos', (req, res) => {
  const restaurante = db.restaurantes.find((r) => r.id === req.params.id);
  if (!restaurante) {
    res.status(404).json({ erro: 'Restaurante não encontrado' });
    return;
  }

  const { nome, precoCentavos, disponivel } = req.body ?? {};

  if (typeof nome !== 'string' || nome.trim() === '') {
    res.status(400).json({ erro: 'O campo "nome" é obrigatório' });
    return;
  }
  if (typeof precoCentavos !== 'number' || !Number.isInteger(precoCentavos) || precoCentavos <= 0) {
    res.status(400).json({ erro: 'O campo "precoCentavos" deve ser um inteiro maior que zero' });
    return;
  }
  if (disponivel !== undefined && typeof disponivel !== 'boolean') {
    res.status(400).json({ erro: 'O campo "disponivel" deve ser booleano' });
    return;
  }

  const produto = {
    id: randomUUID(),
    restauranteId: restaurante.id,
    nome: nome.trim(),
    precoCentavos,
    disponivel: disponivel ?? true,
    criadoEm: new Date().toISOString(),
  };
  db.produtos.push(produto);

  res.status(201).json(produto);
});

router.get('/restaurantes/:id/produtos', (req, res) => {
  const restaurante = db.restaurantes.find((r) => r.id === req.params.id);
  if (!restaurante) {
    res.status(404).json({ erro: 'Restaurante não encontrado' });
    return;
  }

  res.json(db.produtos.filter((p) => p.restauranteId === restaurante.id));
});

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

router.post('/clientes', (req, res) => {
  const { nome, email } = req.body ?? {};

  if (typeof nome !== 'string' || nome.trim() === '') {
    res.status(400).json({ erro: 'O campo "nome" é obrigatório' });
    return;
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ erro: 'O campo "email" deve ser um e-mail válido' });
    return;
  }

  const emailNormalizado = email.trim().toLowerCase();
  if (db.clientes.some((c) => c.email === emailNormalizado)) {
    res.status(422).json({ erro: 'Já existe um cliente cadastrado com este e-mail' });
    return;
  }

  const cliente = {
    id: randomUUID(),
    nome: nome.trim(),
    email: emailNormalizado,
    criadoEm: new Date().toISOString(),
  };
  db.clientes.push(cliente);

  res.status(201).json(cliente);
});

router.get('/clientes/:id/pedidos', (req, res) => {
  const cliente = db.clientes.find((c) => c.id === req.params.id);
  if (!cliente) {
    res.status(404).json({ erro: 'Cliente não encontrado' });
    return;
  }

  res.json(db.pedidos.filter((p) => p.clienteId === cliente.id));
});

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

router.post('/pedidos', (req, res) => {
  const { clienteId, restauranteId, itens } = req.body ?? {};

  // Validação de formato (400)
  if (typeof clienteId !== 'string' || clienteId.trim() === '') {
    res.status(400).json({ erro: 'O campo "clienteId" é obrigatório' });
    return;
  }
  if (typeof restauranteId !== 'string' || restauranteId.trim() === '') {
    res.status(400).json({ erro: 'O campo "restauranteId" é obrigatório' });
    return;
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    res.status(400).json({ erro: 'O pedido deve ter pelo menos 1 item' });
    return;
  }
  for (const item of itens) {
    if (typeof item !== 'object' || item === null) {
      res.status(400).json({ erro: 'Item do pedido inválido' });
      return;
    }
    if (typeof item.produtoId !== 'string' || item.produtoId.trim() === '') {
      res.status(400).json({ erro: 'Cada item deve informar o "produtoId"' });
      return;
    }
    if (typeof item.quantidade !== 'number' || !Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      res.status(400).json({ erro: 'A "quantidade" de cada item deve ser um inteiro maior que zero' });
      return;
    }
  }

  // Existência (404)
  const cliente = db.clientes.find((c) => c.id === clienteId);
  if (!cliente) {
    res.status(404).json({ erro: 'Cliente não encontrado' });
    return;
  }
  const restaurante = db.restaurantes.find((r) => r.id === restauranteId);
  if (!restaurante) {
    res.status(404).json({ erro: 'Restaurante não encontrado' });
    return;
  }

  // Regras de negócio dos itens (404 / 422) e cálculo do total
  const itensPedido: ItemPedido[] = [];
  let subtotalCentavos = 0;

  for (const item of itens as { produtoId: string; quantidade: number }[]) {
    const produto = db.produtos.find((p) => p.id === item.produtoId);
    if (!produto) {
      res.status(404).json({ erro: `Produto ${item.produtoId} não encontrado` });
      return;
    }
    if (produto.restauranteId !== restaurante.id) {
      res.status(422).json({ erro: `O produto "${produto.nome}" não pertence ao restaurante informado` });
      return;
    }
    if (!produto.disponivel) {
      res.status(422).json({ erro: `O produto "${produto.nome}" não está disponível` });
      return;
    }

    const subtotalItem = produto.precoCentavos * item.quantidade;
    subtotalCentavos += subtotalItem;
    itensPedido.push({
      produtoId: produto.id,
      nome: produto.nome,
      quantidade: item.quantidade,
      precoUnitarioCentavos: produto.precoCentavos,
      subtotalCentavos: subtotalItem,
    });
  }

  const agora = new Date().toISOString();
  const pedido: Pedido = {
    id: randomUUID(),
    clienteId: cliente.id,
    restauranteId: restaurante.id,
    itens: itensPedido,
    subtotalCentavos,
    taxaEntregaCentavos: TAXA_ENTREGA_CENTAVOS,
    totalCentavos: subtotalCentavos + TAXA_ENTREGA_CENTAVOS,
    status: 'CRIADO',
    criadoEm: agora,
    atualizadoEm: agora,
  };
  db.pedidos.push(pedido);

  // Simulação de notificação (acoplada diretamente ao handler)
  console.log(
    `[NOTIFICACAO] Notificação enviada ao restaurante "${restaurante.nome}": novo pedido ${pedido.id} ` +
      `(total: ${pedido.totalCentavos} centavos)`,
  );

  res.status(201).json(pedido);
});

router.get('/pedidos/:id', (req, res) => {
  const pedido = db.pedidos.find((p) => p.id === req.params.id);
  if (!pedido) {
    res.status(404).json({ erro: 'Pedido não encontrado' });
    return;
  }

  res.json(pedido);
});

router.patch('/pedidos/:id/cancelar', (req, res) => {
  const pedido = db.pedidos.find((p) => p.id === req.params.id);
  if (!pedido) {
    res.status(404).json({ erro: 'Pedido não encontrado' });
    return;
  }
  if (pedido.status !== 'CRIADO' && pedido.status !== 'CONFIRMADO') {
    res.status(422).json({ erro: `Não é possível cancelar um pedido com status ${pedido.status}` });
    return;
  }

  pedido.status = 'CANCELADO';
  pedido.atualizadoEm = new Date().toISOString();

  res.json(pedido);
});

router.patch('/pedidos/:id/confirmar', (req, res) => {
  const pedido = db.pedidos.find((p) => p.id === req.params.id);
  if (!pedido) {
    res.status(404).json({ erro: 'Pedido não encontrado' });
    return;
  }
  if (pedido.status !== 'CRIADO') {
    res.status(422).json({ erro: `Não é possível confirmar um pedido com status ${pedido.status}` });
    return;
  }

  pedido.status = 'CONFIRMADO';
  pedido.atualizadoEm = new Date().toISOString();

  res.json(pedido);
});
