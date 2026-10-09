import { Cliente } from './Cliente';

/** Porta de persistência de clientes. */
export interface ClienteRepository {
  salvar(cliente: Cliente): Promise<void>;
  buscarPorId(id: string): Promise<Cliente | null>;
  buscarPorEmail(email: string): Promise<Cliente | null>;
}
