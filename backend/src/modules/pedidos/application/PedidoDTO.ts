import { Pedido } from '../domain/Pedido';
import { StatusPedido } from '../domain/StatusPedido';

/** Contrato de saída do módulo (formato exposto pela API), compartilhado pelas fatias. */
export interface ItemPedidoDTO {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitarioCentavos: number;
  subtotalCentavos: number;
}

export interface PedidoDTO {
  id: string;
  clienteId: string;
  restauranteId: string;
  itens: ItemPedidoDTO[];
  subtotalCentavos: number;
  taxaEntregaCentavos: number;
  totalCentavos: number;
  status: StatusPedido;
  criadoEm: string;
  atualizadoEm: string;
}

export function paraPedidoDTO(pedido: Pedido): PedidoDTO {
  return {
    id: pedido.id,
    clienteId: pedido.clienteId,
    restauranteId: pedido.restauranteId,
    itens: pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade.valor,
      precoUnitarioCentavos: item.precoUnitario.centavos,
      subtotalCentavos: item.subtotal.centavos,
    })),
    subtotalCentavos: pedido.subtotal.centavos,
    taxaEntregaCentavos: pedido.taxaEntrega.centavos,
    totalCentavos: pedido.total.centavos,
    status: pedido.status,
    criadoEm: pedido.criadoEm.toISOString(),
    atualizadoEm: pedido.atualizadoEm.toISOString(),
  };
}
