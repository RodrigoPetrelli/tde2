// Exceção permitida à regra de isolamento entre módulos: este adaptador importa
// APENAS o tipo da interface ClienteRepository do módulo clientes (nunca domínio,
// implementações ou features). A instância concreta é injetada pelo composition
// root (main/container.ts).
import type { ClienteRepository } from '../../clientes/domain/ClienteRepository';
import { ClienteGateway } from '../application/ports/ClienteGateway';

export class ClienteGatewayAdapter implements ClienteGateway {
  constructor(private readonly clientes: ClienteRepository) {}

  async clienteExiste(clienteId: string): Promise<boolean> {
    return (await this.clientes.buscarPorId(clienteId)) !== null;
  }
}
