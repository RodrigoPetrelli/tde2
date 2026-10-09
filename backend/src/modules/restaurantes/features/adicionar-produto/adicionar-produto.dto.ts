import {
  exigirBooleanoOpcional,
  exigirNumero,
  exigirTextoPreenchido,
} from '../../../../shared/application/validacao';
import { Produto } from '../../domain/Produto';

/** Entrada não confiável: `restauranteId` vem da rota, o resto do corpo da requisição. */
export interface AdicionarProdutoInput {
  restauranteId: string;
  nome?: unknown;
  precoCentavos?: unknown;
  disponivel?: unknown;
}

export interface AdicionarProdutoDados {
  nome: string;
  precoCentavos: number;
  disponivel?: boolean;
}

/** Valida apenas o formato; a regra "preço inteiro > 0" pertence à entidade Produto. */
export function validarAdicionarProduto(input: AdicionarProdutoInput): AdicionarProdutoDados {
  return {
    nome: exigirTextoPreenchido(input.nome, 'O campo "nome" é obrigatório'),
    precoCentavos: exigirNumero(input.precoCentavos, Produto.MENSAGEM_PRECO_INVALIDO),
    disponivel: exigirBooleanoOpcional(input.disponivel, 'O campo "disponivel" deve ser booleano'),
  };
}
