import { Cliente } from '../domain/Cliente';
import { ClienteRepository } from '../domain/ClienteRepository';

export class InMemoryClienteRepository implements ClienteRepository {
  private readonly clientes = new Map<string, Cliente>();

  async salvar(cliente: Cliente): Promise<void> {
    this.clientes.set(cliente.id, cliente);
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    return this.clientes.get(id) ?? null;
  }

  async buscarPorEmail(email: string): Promise<Cliente | null> {
    return [...this.clientes.values()].find((cliente) => cliente.email === email) ?? null;
  }
}
