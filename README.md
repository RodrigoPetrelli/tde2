# PedeJá

Backend inicial da plataforma de pedidos de delivery de restaurante **PedeJá** (TDE 2 - Arquitetura de Software em Nuvem).

> Versão de partida, propositalmente simples: rotas Express com validação, regra de negócio e acesso a dados (arrays em memória) dentro dos próprios handlers.

## Como rodar

```bash
cd backend && npm install && npm run dev
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

Outros scripts: `npm run build`, `npm start`, `npm test`.

## Endpoints

Valores monetários em centavos (inteiros). Erros retornam `{ "erro": "mensagem" }` (400 validação, 404 não encontrado, 422 regra de negócio).

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Health check (`{ "status": "ok" }`) |
| POST | `/api/restaurantes` | Cria restaurante (`nome`, `categoria`) |
| GET | `/api/restaurantes` | Lista restaurantes |
| POST | `/api/restaurantes/:id/produtos` | Cria produto (`nome`, `precoCentavos` > 0, `disponivel`) |
| GET | `/api/restaurantes/:id/produtos` | Lista o cardápio do restaurante |
| POST | `/api/clientes` | Cria cliente (`nome`, `email` válido e único) |
| GET | `/api/clientes/:id/pedidos` | Lista pedidos do cliente |
| POST | `/api/pedidos` | Cria pedido (`clienteId`, `restauranteId`, `itens: [{ produtoId, quantidade }]`) |
| GET | `/api/pedidos/:id` | Consulta pedido |
| PATCH | `/api/pedidos/:id/confirmar` | CRIADO -> CONFIRMADO |
| PATCH | `/api/pedidos/:id/cancelar` | Cancela pedido CRIADO ou CONFIRMADO |
