import { Produto } from '../domain/Produto';
import { Restaurante } from '../domain/Restaurante';

/** Contratos de saída do módulo (formato exposto pela API), compartilhados pelas fatias. */

export interface RestauranteDTO {
  id: string;
  nome: string;
  categoria: string;
  criadoEm: string;
}

export interface ProdutoDTO {
  id: string;
  restauranteId: string;
  nome: string;
  precoCentavos: number;
  disponivel: boolean;
  criadoEm: string;
}

export function paraRestauranteDTO(restaurante: Restaurante): RestauranteDTO {
  return {
    id: restaurante.id,
    nome: restaurante.nome,
    categoria: restaurante.categoria,
    criadoEm: restaurante.criadoEm.toISOString(),
  };
}

export function paraProdutoDTO(produto: Produto): ProdutoDTO {
  return {
    id: produto.id,
    restauranteId: produto.restauranteId,
    nome: produto.nome,
    precoCentavos: produto.preco.centavos,
    disponivel: produto.disponivel,
    criadoEm: produto.criadoEm.toISOString(),
  };
}
