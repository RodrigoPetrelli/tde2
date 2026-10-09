# PedeJá

Backend da plataforma de pedidos de delivery de restaurante **PedeJá** (TDE 2 - Arquitetura de Software em Nuvem).

> Branch `feature/vertical-slice-clean-architecture`: backend refatorado com IA generativa para **Vertical Slice + Clean Architecture + SOLID**.
> A versão de partida (rotas Express com toda a regra de negócio nos handlers) está na branch `main`.

## Arquitetura

```
backend/src/
  shared/            domain (Entity, AggregateRoot, Money, erros, DomainEvent), application (UseCase, EventBus, IdGenerator),
                     infrastructure (InMemoryEventBus, CryptoIdGenerator), http (adaptador Express, errorHandler)
  modules/
    restaurantes/    domain · application · infrastructure · features/{cadastrar-restaurante, listar-restaurantes, adicionar-produto, listar-cardapio}
    clientes/        domain · application · infrastructure · features/{cadastrar-cliente}
    pedidos/         domain (Pedido + eventos) · application/ports (CatalogoGateway, ClienteGateway, RestauranteInfoGateway)
                     infrastructure (repositório, adaptadores de gateway, NotificacaoRestauranteHandler)
                     features/{criar-pedido, obter-pedido, listar-pedidos-do-cliente, confirmar-pedido, cancelar-pedido}
  main/              composition root (container.ts), app.ts, server.ts
```

- **Vertical Slice:** cada caso de uso é uma pasta em `features/` com DTO/validação, `*UseCase`, `*Controller` e rota.
- **Clean Architecture:** dependências apontam para o domínio; o Express só aparece em `shared/http` e `main`; só `main/` conhece implementações concretas.
- **SOLID:** um caso de uso por classe (SRP), reações via handlers de eventos (OCP), fakes e `InMemory*` intercambiáveis (LSP), portas pequenas (ISP) e injeção por construtor (DIP).

Diagramas de classes e componentes (Mermaid + PNG): [`docs/arquitetura/`](docs/arquitetura/).

## Como rodar

```bash
cd backend && npm install && npm run dev
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

Outros scripts: `npm run build`, `npm start`, `npm test` (tudo), `npm run test:unit`, `npm run test:arch` (testes unitários de arquitetura) e `npm run test:integration`.

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
