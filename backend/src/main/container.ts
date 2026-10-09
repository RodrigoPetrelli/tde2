import { ClienteRepository } from '../modules/clientes/domain/ClienteRepository';
import { CadastrarClienteUseCase } from '../modules/clientes/features/cadastrar-cliente/CadastrarClienteUseCase';
import { InMemoryClienteRepository } from '../modules/clientes/infrastructure/InMemoryClienteRepository';
import { ClientesUseCases } from '../modules/clientes/clientes.module';
import { PedidoCriado } from '../modules/pedidos/domain/events/PedidoCriado';
import { PedidoRepository } from '../modules/pedidos/domain/PedidoRepository';
import { CancelarPedidoUseCase } from '../modules/pedidos/features/cancelar-pedido/CancelarPedidoUseCase';
import { ConfirmarPedidoUseCase } from '../modules/pedidos/features/confirmar-pedido/ConfirmarPedidoUseCase';
import { CriarPedidoUseCase } from '../modules/pedidos/features/criar-pedido/CriarPedidoUseCase';
import { ListarPedidosDoClienteUseCase } from '../modules/pedidos/features/listar-pedidos-do-cliente/ListarPedidosDoClienteUseCase';
import { ObterPedidoUseCase } from '../modules/pedidos/features/obter-pedido/ObterPedidoUseCase';
import { CatalogoGatewayAdapter } from '../modules/pedidos/infrastructure/CatalogoGatewayAdapter';
import { ClienteGatewayAdapter } from '../modules/pedidos/infrastructure/ClienteGatewayAdapter';
import { InMemoryPedidoRepository } from '../modules/pedidos/infrastructure/InMemoryPedidoRepository';
import { NotificacaoRestauranteHandler } from '../modules/pedidos/infrastructure/NotificacaoRestauranteHandler';
import { PedidosUseCases } from '../modules/pedidos/pedidos.module';
import { RestauranteRepository } from '../modules/restaurantes/domain/RestauranteRepository';
import { AdicionarProdutoUseCase } from '../modules/restaurantes/features/adicionar-produto/AdicionarProdutoUseCase';
import { CadastrarRestauranteUseCase } from '../modules/restaurantes/features/cadastrar-restaurante/CadastrarRestauranteUseCase';
import { ListarCardapioUseCase } from '../modules/restaurantes/features/listar-cardapio/ListarCardapioUseCase';
import { ListarRestaurantesUseCase } from '../modules/restaurantes/features/listar-restaurantes/ListarRestaurantesUseCase';
import { InMemoryRestauranteRepository } from '../modules/restaurantes/infrastructure/InMemoryRestauranteRepository';
import { RestaurantesUseCases } from '../modules/restaurantes/restaurantes.module';
import { EventBus } from '../shared/application/EventBus';
import { IdGenerator } from '../shared/application/IdGenerator';
import { CryptoIdGenerator } from '../shared/infrastructure/CryptoIdGenerator';
import { InMemoryEventBus } from '../shared/infrastructure/InMemoryEventBus';

/** Implementações de infraestrutura; qualquer uma pode ser substituída (ex.: em testes). */
export interface Infraestrutura {
  idGenerator: IdGenerator;
  eventBus: EventBus;
  restauranteRepository: RestauranteRepository;
  clienteRepository: ClienteRepository;
  pedidoRepository: PedidoRepository;
}

export interface Container {
  restaurantes: RestaurantesUseCases;
  clientes: ClientesUseCases;
  pedidos: PedidosUseCases;
}

/** Composition root: único lugar que conhece as implementações concretas e faz a ligação (DI manual). */
export function createContainer(substituicoes: Partial<Infraestrutura> = {}): Container {
  const infra: Infraestrutura = {
    idGenerator: new CryptoIdGenerator(),
    eventBus: new InMemoryEventBus(),
    restauranteRepository: new InMemoryRestauranteRepository(),
    clienteRepository: new InMemoryClienteRepository(),
    pedidoRepository: new InMemoryPedidoRepository(),
    ...substituicoes,
  };
  const { idGenerator, eventBus, restauranteRepository, clienteRepository, pedidoRepository } = infra;

  // Adaptadores anticorrupção: pedidos enxerga os outros módulos só pelas suas portas.
  const catalogo = new CatalogoGatewayAdapter(restauranteRepository);
  const clientes = new ClienteGatewayAdapter(clienteRepository);

  // Reações a eventos de domínio (OCP: novas reações = novos handlers registrados aqui).
  eventBus.assinar(PedidoCriado.NOME, new NotificacaoRestauranteHandler(catalogo));

  return {
    restaurantes: {
      cadastrarRestaurante: new CadastrarRestauranteUseCase(restauranteRepository, idGenerator),
      listarRestaurantes: new ListarRestaurantesUseCase(restauranteRepository),
      adicionarProduto: new AdicionarProdutoUseCase(restauranteRepository, idGenerator),
      listarCardapio: new ListarCardapioUseCase(restauranteRepository),
    },
    clientes: {
      cadastrarCliente: new CadastrarClienteUseCase(clienteRepository, idGenerator),
    },
    pedidos: {
      criarPedido: new CriarPedidoUseCase(pedidoRepository, catalogo, clientes, idGenerator, eventBus),
      obterPedido: new ObterPedidoUseCase(pedidoRepository),
      listarPedidosDoCliente: new ListarPedidosDoClienteUseCase(pedidoRepository, clientes),
      confirmarPedido: new ConfirmarPedidoUseCase(pedidoRepository, eventBus),
      cancelarPedido: new CancelarPedidoUseCase(pedidoRepository, eventBus),
    },
  };
}
