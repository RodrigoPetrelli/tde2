import { Cliente } from '../domain/Cliente';

/** Contrato de saída do módulo (formato exposto pela API). */
export interface ClienteDTO {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

export function paraClienteDTO(cliente: Cliente): ClienteDTO {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    criadoEm: cliente.criadoEm.toISOString(),
  };
}
