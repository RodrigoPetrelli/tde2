// "Banco de dados" em memória: arrays simples compartilhados por toda a aplicação.

export type StatusPedido = 'CRIADO' | 'CONFIRMADO' | 'CANCELADO';

export interface Restaurante {
  id: string;
  nome: string;
  categoria: string;
  criadoEm: string;
}

export interface Produto {
  id: string;
  restauranteId: string;
  nome: string;
  precoCentavos: number;
  disponivel: boolean;
  criadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

export interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitarioCentavos: number;
  subtotalCentavos: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  restauranteId: string;
  itens: ItemPedido[];
  subtotalCentavos: number;
  taxaEntregaCentavos: number;
  totalCentavos: number;
  status: StatusPedido;
  criadoEm: string;
  atualizadoEm: string;
}

export const db = {
  restaurantes: [] as Restaurante[],
  produtos: [] as Produto[],
  clientes: [] as Cliente[],
  pedidos: [] as Pedido[],
};
