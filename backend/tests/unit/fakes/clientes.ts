import { Cliente } from '../../../src/modules/clientes/domain/Cliente';
import { ClienteRepository } from '../../../src/modules/clientes/domain/ClienteRepository';

/** Fake em memória da porta de persistência de clientes. */
export class FakeClienteRepository implements ClienteRepository {
  readonly salvos: Cliente[] = [];
  private readonly clientes: Cliente[] = [];

  constructor(iniciais: readonly Cliente[] = []) {
    this.clientes.push(...iniciais);
  }

  async salvar(cliente: Cliente): Promise<void> {
    this.salvos.push(cliente);
    const indice = this.clientes.findIndex((c) => c.id === cliente.id);
    if (indice >= 0) {
      this.clientes[indice] = cliente;
    } else {
      this.clientes.push(cliente);
    }
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    return this.clientes.find((c) => c.id === id) ?? null;
  }

  async buscarPorEmail(email: string): Promise<Cliente | null> {
    return this.clientes.find((c) => c.email === email) ?? null;
  }
}
