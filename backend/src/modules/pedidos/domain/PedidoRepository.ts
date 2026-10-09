import { Pedido } from './Pedido';

/** Porta de persistência do agregado Pedido. */
export interface PedidoRepository {
  salvar(pedido: Pedido): Promise<void>;
  buscarPorId(id: string): Promise<Pedido | null>;
  listarPorCliente(clienteId: string): Promise<Pedido[]>;
}
