# Diagramas de classes (UML)

Backend PedeJá — Vertical Slice + Clean Architecture + SOLID. Imagens em `img/`, código Mermaid em `mermaid/`.

## Shared — domain

```mermaid
---
title: Diagrama de classes - shared.domain
config:
  layout: elk
---
classDiagram
  direction TB

  namespace shared.domain {
    class Entity {
      <<abstract>>
      +id: string
      #Entity(id string)
      +equals(outra Entity) boolean
    }
    class AggregateRoot {
      <<abstract>>
      -eventosPendentes: DomainEvent[]
      #registrarEvento(evento DomainEvent) void
      +puxarEventos() DomainEvent[]
    }
    class DomainEvent {
      <<interface>>
      +nome: string
      +ocorridoEm: Date
    }
    class Money {
      <<value object>>
      +centavos: number
      +deCentavos(centavos number)$ Money
      +zero()$ Money
      +somar(outro Money) Money
      +multiplicar(fator number) Money
      +ehPositivo() boolean
      +equals(outro Money) boolean
    }
    class DomainError {
      <<abstract>>
      #DomainError(message string)
    }
    class ValidationError
    class NotFoundError
    class BusinessRuleError
  }

  class Error {
    <<built-in>>
  }

  AggregateRoot --|> Entity
  AggregateRoot o-- "0..*" DomainEvent : eventosPendentes
  Money ..> ValidationError : lanca
  ValidationError --|> DomainError
  NotFoundError --|> DomainError
  BusinessRuleError --|> DomainError
  DomainError --|> Error
```

![Shared — domain](img/classes-shared-domain.png)

Kernel compartilhado: `Entity`, `AggregateRoot`, `DomainEvent`, `Money` e erros de domínio. **Clean Architecture:** camada mais interna, sem dependência de framework. **LSP:** erros especializam `DomainError` e são tratados de forma uniforme pelo `errorHandler`.

## Shared — application

```mermaid
---
title: Diagrama de classes - shared.application e shared.infrastructure
config:
  layout: elk
---
classDiagram
  direction TB

  namespace shared.application {
    class UseCase~I, O~ {
      <<interface>>
      +execute(input I) Promise~O~
    }
    class IdGenerator {
      <<interface>>
      +gerar() string
    }
    class EventHandler~E~ {
      <<interface>>
      +handle(evento E) Promise~void~
    }
    class EventPublisher {
      <<interface>>
      +publicar(eventos DomainEvent[]) Promise~void~
    }
    class EventSubscriber {
      <<interface>>
      +assinar(nomeEvento string, handler EventHandler) void
    }
    class EventBus {
      <<interface>>
    }
    class validacao {
      <<utility>>
      +ehObjeto(valor unknown)$ boolean
      +exigirTextoPreenchido(valor unknown, mensagem string)$ string
      +exigirTexto(valor unknown, mensagem string)$ string
      +exigirNumero(valor unknown, mensagem string)$ number
      +exigirBooleanoOpcional(valor unknown, mensagem string)$ boolean
    }
  }

  namespace shared.infrastructure {
    class CryptoIdGenerator {
      +gerar() string
    }
    class InMemoryEventBus {
      -handlers: Map~string, EventHandler[]~
      +assinar(nomeEvento string, handler EventHandler) void
      +publicar(eventos DomainEvent[]) Promise~void~
    }
  }

  namespace shared.domain {
    class DomainEvent {
      <<interface>>
    }
    class ValidationError
  }

  CryptoIdGenerator ..|> IdGenerator
  InMemoryEventBus ..|> EventBus
  InMemoryEventBus o-- "0..*" EventHandler : handlers
  EventBus --|> EventPublisher
  EventBus --|> EventSubscriber
  EventSubscriber ..> EventHandler
  EventPublisher ..> DomainEvent
  EventHandler ..> DomainEvent
  validacao ..> ValidationError : lanca
```

![Shared — application](img/classes-shared-application.png)

Contratos usados por todas as fatias: `UseCase<I,O>`, `EventBus` (dividido em `EventPublisher` e `EventSubscriber` — **ISP**) e `IdGenerator`. **DIP:** casos de uso dependem dessas abstrações; as implementações (`InMemoryEventBus`, `CryptoIdGenerator`) ficam em `shared/infrastructure`.

## Shared — http

```mermaid
---
title: Diagrama de classes - shared.http (adaptador HTTP / Express)
config:
  layout: elk
---
classDiagram
  direction TB

  namespace shared.http {
    class HttpController {
      <<interface>>
      +handle(request HttpRequest) Promise~HttpResponse~
    }
    class HttpRequest {
      <<interface>>
      +params: Record~string, string~
      +body: Record~string, unknown~
    }
    class HttpResponse {
      <<interface>>
      +statusCode: number
      +body: unknown
    }
    class HttpRoute {
      <<interface>>
      +method: HttpMethod
      +path: string
      +controller: HttpController
    }
    class HttpMethod {
      <<enumeration>>
      get
      post
      put
      patch
      delete
    }
    class expressAdapter {
      <<utility>>
      +adaptarController(controller HttpController)$ RequestHandler
      +montarRouter(rotas HttpRoute[])$ HttpRouter
    }
    class asyncHandler {
      <<utility>>
      +asyncHandler(fn)$ RequestHandler
    }
    class errorHandler {
      <<utility>>
      +errorHandler(err, req, res, next)$ void
      +notFoundHandler(req, res)$ void
    }
  }

  namespace shared.domain {
    class ValidationError
    class NotFoundError
    class BusinessRuleError
  }

  HttpController ..> HttpRequest
  HttpController ..> HttpResponse
  HttpRoute --> HttpMethod
  HttpRoute --> HttpController
  expressAdapter ..> HttpRoute
  expressAdapter ..> HttpController
  expressAdapter ..> asyncHandler
  errorHandler ..> ValidationError : 400
  errorHandler ..> NotFoundError : 404
  errorHandler ..> BusinessRuleError : 422
```

![Shared — http](img/classes-shared-http.png)

Borda HTTP: `HttpController`, `HttpRequest/HttpResponse`, adaptador Express e `errorHandler`. **Clean Architecture:** o Express fica isolado aqui e em `main`; controllers das fatias implementam `HttpController` sem conhecer o framework. **SRP:** mapeamento de erros de domínio para 400/404/422 em um único lugar.

## Módulo restaurantes

```mermaid
---
title: Diagrama de classes - restaurantes (domain, application, infrastructure)
config:
  layout: elk
---
classDiagram
  direction TB

  namespace restaurantes.application {
    class RestauranteDTO {
      <<interface>>
      +id: string
      +nome: string
      +categoria: string
      +criadoEm: string
    }
    class ProdutoDTO {
      <<interface>>
      +id: string
      +restauranteId: string
      +nome: string
      +precoCentavos: number
      +disponivel: boolean
      +criadoEm: string
    }
  }

  namespace restaurantes.infrastructure {
    class InMemoryRestauranteRepository {
      -restaurantes: Map~string, Restaurante~
      -produtos: Map~string, Produto~
      +salvar(restaurante Restaurante) Promise~void~
      +buscarPorId(id string) Promise~Restaurante | null~
      +listarTodos() Promise~Restaurante[]~
      +salvarProduto(produto Produto) Promise~void~
      +listarProdutosDoRestaurante(restauranteId string) Promise~Produto[]~
      +buscarProdutosPorIds(ids string[]) Promise~Produto[]~
    }
  }

  namespace restaurantes.domain {
    class RestauranteRepository {
      <<interface>>
      +salvar(restaurante Restaurante) Promise~void~
      +buscarPorId(id string) Promise~Restaurante | null~
      +listarTodos() Promise~Restaurante[]~
      +salvarProduto(produto Produto) Promise~void~
      +listarProdutosDoRestaurante(restauranteId string) Promise~Produto[]~
      +buscarProdutosPorIds(ids string[]) Promise~Produto[]~
    }
    class Restaurante {
      +nome: string
      +categoria: string
      +criadoEm: Date
      +criar(props CriarRestauranteProps, agora Date)$ Restaurante
    }
    class Produto {
      +MENSAGEM_PRECO_INVALIDO: string$
      +restauranteId: string
      +nome: string
      +preco: Money
      +disponivel: boolean
      +criadoEm: Date
      +criar(props CriarProdutoProps, agora Date)$ Produto
      +pertenceAo(restauranteId string) boolean
    }
  }

  namespace shared.domain {
    class Entity {
      <<abstract>>
    }
    class Money {
      <<value object>>
    }
  }

  InMemoryRestauranteRepository ..|> RestauranteRepository
  RestauranteRepository ..> Restaurante
  RestauranteRepository ..> Produto
  RestauranteDTO ..> Restaurante : paraRestauranteDTO
  ProdutoDTO ..> Produto : paraProdutoDTO
  Restaurante --|> Entity
  Produto --|> Entity
  Produto --> "1" Money : preco
```

![Módulo restaurantes](img/classes-restaurantes-domain.png)

Entidades `Restaurante` e `Produto` (preço > 0 validado na entidade — **SRP**), porta `RestauranteRepository` e a implementação `InMemoryRestauranteRepository` (**LSP/DIP**). As fatias `cadastrar-restaurante`, `listar-restaurantes`, `adicionar-produto` e `listar-cardapio` seguem o mesmo padrão das fatias de pedidos.

## Módulo clientes

```mermaid
---
title: Diagrama de classes - modulo clientes
config:
  layout: elk
---
classDiagram
  direction TB

  namespace clientes.features.cadastrar-cliente {
    class CadastrarClienteController {
      +handle(request HttpRequest) Promise~HttpResponse~
    }
    class CadastrarClienteUseCase {
      +execute(input CadastrarClienteInput) Promise~ClienteDTO~
    }
    class CadastrarClienteInput {
      <<interface>>
      +nome?: unknown
      +email?: unknown
    }
  }

  namespace clientes.application {
    class ClienteDTO {
      <<interface>>
      +id: string
      +nome: string
      +email: string
      +criadoEm: string
    }
  }

  namespace clientes.domain {
    class Cliente {
      +MENSAGEM_EMAIL_INVALIDO: string$
      +nome: string
      +email: string
      +criadoEm: Date
      +criar(props CriarClienteProps, agora Date)$ Cliente
    }
    class ClienteRepository {
      <<interface>>
      +salvar(cliente Cliente) Promise~void~
      +buscarPorId(id string) Promise~Cliente | null~
      +buscarPorEmail(email string) Promise~Cliente | null~
    }
  }

  namespace clientes.infrastructure {
    class InMemoryClienteRepository {
      -clientes: Map~string, Cliente~
      +salvar(cliente Cliente) Promise~void~
      +buscarPorId(id string) Promise~Cliente | null~
      +buscarPorEmail(email string) Promise~Cliente | null~
    }
  }

  namespace shared {
    class HttpController {
      <<interface>>
    }
    class UseCase~I, O~ {
      <<interface>>
    }
    class IdGenerator {
      <<interface>>
    }
    class Entity {
      <<abstract>>
    }
  }

  CadastrarClienteController ..|> HttpController
  CadastrarClienteController ..> UseCase : useCase
  CadastrarClienteUseCase ..|> UseCase
  CadastrarClienteUseCase ..> CadastrarClienteInput
  CadastrarClienteUseCase ..> ClienteDTO
  CadastrarClienteUseCase ..> ClienteRepository : clientes
  CadastrarClienteUseCase ..> IdGenerator : ids
  CadastrarClienteUseCase ..> Cliente : criar
  Cliente --|> Entity
  ClienteRepository ..> Cliente
  InMemoryClienteRepository ..|> ClienteRepository
```

![Módulo clientes](img/classes-clientes.png)

**Vertical Slice:** a fatia `cadastrar-cliente` agrupa Controller, UseCase e Input. **Clean Architecture:** `Cliente` (domínio) valida o e-mail; o caso de uso depende só de `ClienteRepository` e `IdGenerator` (**DIP**); `InMemoryClienteRepository` realiza a porta (**LSP**).

## Módulo pedidos — domain, ports e infrastructure

```mermaid
---
title: Diagrama de classes - modulo pedidos (domain, application e infrastructure)
config:
  layout: elk
---
classDiagram
  direction TB

  namespace pedidos.domain {
    class Pedido {
      +TAXA_ENTREGA: Money$
      +clienteId: string
      +restauranteId: string
      +itens: ItemPedido[]
      +taxaEntrega: Money
      +status: StatusPedido
      +subtotal: Money
      +total: Money
      +criar(props CriarPedidoProps, agora Date)$ Pedido
      +confirmar(agora Date) void
      +cancelar(agora Date) void
    }
    class ItemPedido {
      +produtoId: string
      +nome: string
      +quantidade: Quantidade
      +precoUnitario: Money
      +subtotal: Money
      +criar(props CriarItemPedidoProps)$ ItemPedido
    }
    class Quantidade {
      +valor: number
      +criar(valor number)$ Quantidade
    }
    class StatusPedido {
      <<enumeration>>
      CRIADO
      CONFIRMADO
      CANCELADO
    }
    class ProdutoDoCatalogo {
      <<interface>>
      +id: string
      +nome: string
      +precoCentavos: number
      +disponivel: boolean
      +pertenceAoRestaurante: boolean
    }
    class PedidoRepository {
      <<interface>>
      +salvar(pedido Pedido) Promise~void~
      +buscarPorId(id string) Promise~Pedido~
      +listarPorCliente(clienteId string) Promise~Pedido[]~
    }
    class PedidoCriado
    class PedidoConfirmado
    class PedidoCancelado
  }

  namespace pedidos.application.ports {
    class CatalogoGateway {
      <<interface>>
      +restauranteExiste(restauranteId string) Promise~boolean~
      +buscarProdutosDoRestaurante(restauranteId string, produtoIds string[]) Promise~ProdutoDoCatalogo[]~
    }
    class ClienteGateway {
      <<interface>>
      +clienteExiste(clienteId string) Promise~boolean~
    }
    class RestauranteInfoGateway {
      <<interface>>
      +obterNomeDoRestaurante(restauranteId string) Promise~string~
    }
  }

  namespace pedidos.infrastructure {
    class InMemoryPedidoRepository {
      -pedidos: Map~string, Pedido~
    }
    class CatalogoGatewayAdapter
    class ClienteGatewayAdapter
    class NotificacaoRestauranteHandler {
      +handle(evento PedidoCriado) Promise~void~
    }
  }

  namespace shared_e_outros_modulos {
    class AggregateRoot {
      <<abstract>>
      +puxarEventos() DomainEvent[]
    }
    class DomainEvent {
      <<interface>>
    }
    class EventHandler~E~ {
      <<interface>>
    }
    class RestauranteRepository {
      <<interface>>
    }
    class ClienteRepository {
      <<interface>>
    }
  }

  Pedido --|> AggregateRoot
  Pedido "1" *-- "1..*" ItemPedido : itens
  ItemPedido *-- Quantidade
  Pedido --> StatusPedido
  Pedido ..> PedidoCriado : registra
  Pedido ..> PedidoConfirmado : registra
  Pedido ..> PedidoCancelado : registra
  PedidoCriado ..|> DomainEvent
  PedidoConfirmado ..|> DomainEvent
  PedidoCancelado ..|> DomainEvent
  ItemPedido ..> ProdutoDoCatalogo
  PedidoRepository ..> Pedido
  CatalogoGateway ..> ProdutoDoCatalogo
  InMemoryPedidoRepository ..|> PedidoRepository
  CatalogoGatewayAdapter ..|> CatalogoGateway
  CatalogoGatewayAdapter ..|> RestauranteInfoGateway
  CatalogoGatewayAdapter ..> RestauranteRepository : import type
  ClienteGatewayAdapter ..|> ClienteGateway
  ClienteGatewayAdapter ..> ClienteRepository : import type
  NotificacaoRestauranteHandler ..|> EventHandler
  NotificacaoRestauranteHandler ..> RestauranteInfoGateway
```

![Módulo pedidos — domain, ports e infrastructure](img/classes-pedidos-domain.png)

`Pedido` é a raiz do agregado (composição com `ItemPedido`), concentra total, taxa de 790 centavos e transições de status (**SRP**) e registra eventos de domínio (**EDA**). Portas pequenas `CatalogoGateway`, `ClienteGateway` e `RestauranteInfoGateway` (**ISP**) isolam o módulo de restaurantes e clientes; os adaptadores importam só as interfaces (`import type`). `NotificacaoRestauranteHandler` reage a `PedidoCriado` (**OCP**).

## Módulo pedidos — fatias verticais

```mermaid
---
title: Diagrama de classes - modulo pedidos (fatias verticais)
config:
  layout: elk
---
classDiagram
  direction TB

  namespace features.criar-pedido {
    class CriarPedidoController {
      +handle(request HttpRequest) Promise~HttpResponse~
    }
    class CriarPedidoUseCase {
      +execute(input CriarPedidoInput) Promise~PedidoDTO~
    }
  }
  namespace features.obter-pedido {
    class ObterPedidoController
    class ObterPedidoUseCase {
      +execute(input ObterPedidoInput) Promise~PedidoDTO~
    }
  }
  namespace features.listar-pedidos-do-cliente {
    class ListarPedidosDoClienteController
    class ListarPedidosDoClienteUseCase {
      +execute(input ListarPedidosDoClienteInput) Promise~PedidoDTO[]~
    }
  }
  namespace features.confirmar-pedido {
    class ConfirmarPedidoController
    class ConfirmarPedidoUseCase {
      +execute(input ConfirmarPedidoInput) Promise~PedidoDTO~
    }
  }
  namespace features.cancelar-pedido {
    class CancelarPedidoController
    class CancelarPedidoUseCase {
      +execute(input CancelarPedidoInput) Promise~PedidoDTO~
    }
  }

  namespace portas {
    class UseCase~I, O~ {
      <<interface>>
      +execute(input I) Promise~O~
    }
    class HttpController {
      <<interface>>
      +handle(request HttpRequest) Promise~HttpResponse~
    }
    class PedidoRepository {
      <<interface>>
    }
    class CatalogoGateway {
      <<interface>>
    }
    class ClienteGateway {
      <<interface>>
    }
    class EventPublisher {
      <<interface>>
      +publicar(eventos DomainEvent[]) Promise~void~
    }
    class IdGenerator {
      <<interface>>
      +gerar() string
    }
  }

  CriarPedidoController ..|> HttpController
  ObterPedidoController ..|> HttpController
  ListarPedidosDoClienteController ..|> HttpController
  ConfirmarPedidoController ..|> HttpController
  CancelarPedidoController ..|> HttpController
  CriarPedidoController ..> UseCase
  ObterPedidoController ..> UseCase
  ListarPedidosDoClienteController ..> UseCase
  ConfirmarPedidoController ..> UseCase
  CancelarPedidoController ..> UseCase

  CriarPedidoUseCase ..|> UseCase
  ObterPedidoUseCase ..|> UseCase
  ListarPedidosDoClienteUseCase ..|> UseCase
  ConfirmarPedidoUseCase ..|> UseCase
  CancelarPedidoUseCase ..|> UseCase

  CriarPedidoUseCase ..> PedidoRepository
  CriarPedidoUseCase ..> CatalogoGateway
  CriarPedidoUseCase ..> ClienteGateway
  CriarPedidoUseCase ..> IdGenerator
  CriarPedidoUseCase ..> EventPublisher
  ObterPedidoUseCase ..> PedidoRepository
  ListarPedidosDoClienteUseCase ..> PedidoRepository
  ListarPedidosDoClienteUseCase ..> ClienteGateway
  ConfirmarPedidoUseCase ..> PedidoRepository
  ConfirmarPedidoUseCase ..> EventPublisher
  CancelarPedidoUseCase ..> PedidoRepository
  CancelarPedidoUseCase ..> EventPublisher
```

![Módulo pedidos — fatias verticais](img/classes-pedidos-features.png)

Cada fatia (`criar-pedido`, `obter-pedido`, `listar-pedidos-do-cliente`, `confirmar-pedido`, `cancelar-pedido`) tem um Controller e um UseCase próprios (**Vertical Slice**, **SRP**). Todos os casos de uso implementam `UseCase` e recebem portas por construtor (**DIP**); nenhuma fatia depende de outra.
