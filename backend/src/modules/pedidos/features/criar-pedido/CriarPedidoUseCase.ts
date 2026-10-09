import { EventPublisher } from '../../../../shared/application/EventBus';
import { IdGenerator } from '../../../../shared/application/IdGenerator';
import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { PedidoDTO, paraPedidoDTO } from '../../application/PedidoDTO';
import { CatalogoGateway } from '../../application/ports/CatalogoGateway';
import { ClienteGateway } from '../../application/ports/ClienteGateway';
import { ItemPedido } from '../../domain/ItemPedido';
import { Pedido } from '../../domain/Pedido';
import { PedidoRepository } from '../../domain/PedidoRepository';
import { CriarPedidoInput, validarCriarPedido } from './criar-pedido.dto';

/**
 * Cria um pedido e publica seus eventos de domínio. Reações (ex.: notificar o
 * restaurante) são handlers registrados no EventBus, não código deste caso de uso.
 */
export class CriarPedidoUseCase implements UseCase<CriarPedidoInput, PedidoDTO> {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly catalogo: CatalogoGateway,
    private readonly clientes: ClienteGateway,
    private readonly ids: IdGenerator,
    private readonly eventos: EventPublisher,
  ) {}

  async execute(input: CriarPedidoInput): Promise<PedidoDTO> {
    const dados = validarCriarPedido(input);

    if (!(await this.clientes.clienteExiste(dados.clienteId))) {
      throw new NotFoundError('Cliente não encontrado');
    }
    if (!(await this.catalogo.restauranteExiste(dados.restauranteId))) {
      throw new NotFoundError('Restaurante não encontrado');
    }

    const produtoIds = [...new Set(dados.itens.map((item) => item.produtoId))];
    const produtos = new Map(
      (await this.catalogo.buscarProdutosDoRestaurante(dados.restauranteId, produtoIds)).map((p) => [p.id, p]),
    );

    const itens = dados.itens.map(({ produtoId, quantidade }) => {
      const produto = produtos.get(produtoId);
      if (!produto) {
        throw new NotFoundError(`Produto ${produtoId} não encontrado`);
      }
      return ItemPedido.criar({ produto, quantidade });
    });

    const pedido = Pedido.criar({
      id: this.ids.gerar(),
      clienteId: dados.clienteId,
      restauranteId: dados.restauranteId,
      itens,
    });

    await this.pedidos.salvar(pedido);
    await this.eventos.publicar(pedido.puxarEventos());

    return paraPedidoDTO(pedido);
  }
}
