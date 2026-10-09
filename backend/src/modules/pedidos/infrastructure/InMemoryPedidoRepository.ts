import { Pedido } from '../domain/Pedido';
import { PedidoRepository } from '../domain/PedidoRepository';

export class InMemoryPedidoRepository implements PedidoRepository {
  private readonly pedidos = new Map<string, Pedido>();

  async salvar(pedido: Pedido): Promise<void> {
    this.pedidos.set(pedido.id, pedido);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    return this.pedidos.get(id) ?? null;
  }

  async listarPorCliente(clienteId: string): Promise<Pedido[]> {
    return [...this.pedidos.values()].filter((pedido) => pedido.clienteId === clienteId);
  }
}
