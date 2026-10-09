# Diagramas de componentes

Backend PedeJá — Vertical Slice + Clean Architecture + SOLID. Imagens em `img/`, código Mermaid em `mermaid/`.

## Componentes do backend

```mermaid
---
title: Diagrama de componentes - backend PedeJa
---
flowchart TB
  cliente([Cliente HTTP])

  subgraph main[main - composition root]
    app[app.ts / server.ts]
    container[container.ts]
  end

  subgraph sharedhttp[shared/http]
    adapter[expressAdapter + errorHandler]
  end

  subgraph restaurantes[modulo restaurantes]
    direction TB
    r_feat[[features: cadastrar-restaurante, listar-restaurantes, adicionar-produto, listar-cardapio]]
    r_inf[infrastructure: InMemoryRestauranteRepository]
    r_dom[(domain: Restaurante, Produto, RestauranteRepository)]
  end

  subgraph clientes[modulo clientes]
    direction TB
    c_feat[[features: cadastrar-cliente]]
    c_inf[infrastructure: InMemoryClienteRepository]
    c_dom[(domain: Cliente, ClienteRepository)]
  end

  subgraph pedidos[modulo pedidos]
    direction TB
    p_feat[[features: criar, obter, listar-do-cliente, confirmar, cancelar]]
    p_inf[infrastructure: InMemoryPedidoRepository, GatewayAdapters, NotificacaoRestauranteHandler]
    p_ports{{application/ports: CatalogoGateway, ClienteGateway, RestauranteInfoGateway}}
    p_dom[(domain: Pedido, ItemPedido, eventos, PedidoRepository)]
  end

  subgraph shared[shared - kernel]
    s_inf[infrastructure: InMemoryEventBus, CryptoIdGenerator]
    s_app{{application: UseCase, EventBus, IdGenerator}}
    s_dom[(domain: Entity, AggregateRoot, Money, erros)]
  end

  cliente --> app
  app --> adapter
  app --> container
  adapter --> r_feat & c_feat & p_feat
  container -. instancia .-> r_inf & c_inf & p_inf & s_inf
  container -. injeta .-> r_feat & c_feat & p_feat

  r_feat --> r_dom
  c_feat --> c_dom
  p_feat --> p_dom
  p_feat --> p_ports
  r_feat & c_feat & p_feat --> s_app

  r_inf -. implementa .-> r_dom
  c_inf -. implementa .-> c_dom
  p_inf -. implementa .-> p_dom
  p_inf -. implementa .-> p_ports
  p_inf -. import type .-> r_dom & c_dom
  s_inf -. implementa .-> s_app

  r_dom & c_dom & p_dom --> s_dom
```

![Componentes do backend](img/componentes-backend.png)

`main` (composition root) instancia a infraestrutura e injeta os casos de uso; `shared/http` encaminha as requisições às fatias. Em cada módulo, as fatias dependem do domínio e das portas, e a infraestrutura **implementa** as portas: todas as setas apontam para dentro (**Clean Architecture / DIP**). A única ligação entre módulos é `pedidos/infrastructure` → interfaces de repositório (`import type`), coberta pelos testes de arquitetura.

## Grade Vertical Slice × Clean Architecture

```mermaid
---
title: Grade Vertical Slice x Clean Architecture
---
flowchart TB
  subgraph L1[Adaptadores de interface - rota + Controller]
    direction LR
    h1[criar-pedido]:::http
    h2[cancelar-pedido]:::http
    h3[cadastrar-cliente]:::http
    h4[adicionar-produto]:::http
  end
  subgraph L2[Casos de uso - features/*/UseCase]
    direction LR
    u1[CriarPedidoUseCase]:::uc
    u2[CancelarPedidoUseCase]:::uc
    u3[CadastrarClienteUseCase]:::uc
    u4[AdicionarProdutoUseCase]:::uc
  end
  subgraph L3[Portas - interfaces]
    direction LR
    p1[PedidoRepository, CatalogoGateway, EventPublisher]:::port
    p3[ClienteRepository]:::port
    p4[RestauranteRepository]:::port
  end
  subgraph L4[Entidades - domain]
    direction LR
    e1[Pedido, ItemPedido]:::ent
    e3[Cliente]:::ent
    e4[Restaurante, Produto]:::ent
  end
  h1 --> u1 --> p1
  h2 --> u2 --> p1
  h3 --> u3 --> p3
  h4 --> u4 --> p4
  u1 & u2 --> e1
  u3 --> e3
  u4 --> e4
  classDef http fill:#e3f2fd,stroke:#1565c0
  classDef uc fill:#e8f5e9,stroke:#2e7d32
  classDef port fill:#fff8e1,stroke:#f9a825
  classDef ent fill:#fce4ec,stroke:#ad1457
```

![Grade Vertical Slice × Clean Architecture](img/componentes-grade.png)

As colunas são fatias verticais (um caso de uso cada) e as faixas horizontais são as camadas da Clean Architecture. Cada fatia atravessa as camadas de cima para baixo (adaptador → caso de uso → portas → entidades) e nunca na direção oposta.
