/** Porta para consultar o módulo clientes apenas no que pedidos precisa. */
export interface ClienteGateway {
  clienteExiste(clienteId: string): Promise<boolean>;
}
