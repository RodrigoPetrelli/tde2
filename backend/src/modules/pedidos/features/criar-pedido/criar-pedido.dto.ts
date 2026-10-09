import { ehObjeto, exigirNumero, exigirTextoPreenchido } from '../../../../shared/application/validacao';
import { ValidationError } from '../../../../shared/domain/errors';
import { Pedido } from '../../domain/Pedido';
import { Quantidade } from '../../domain/Quantidade';

/** Entrada não confiável (vinda do corpo da requisição). */
export interface CriarPedidoInput {
  clienteId?: unknown;
  restauranteId?: unknown;
  itens?: unknown;
}

export interface ItemSolicitado {
  produtoId: string;
  quantidade: Quantidade;
}

export interface CriarPedidoDados {
  clienteId: string;
  restauranteId: string;
  itens: ItemSolicitado[];
}

/**
 * Valida o formato do pedido antes de qualquer consulta (erros 400 vêm antes dos 404).
 * A regra de quantidade é do domínio (`Quantidade`), apenas aplicada aqui cedo.
 */
export function validarCriarPedido(input: CriarPedidoInput): CriarPedidoDados {
  const clienteId = exigirTextoPreenchido(input.clienteId, 'O campo "clienteId" é obrigatório');
  const restauranteId = exigirTextoPreenchido(input.restauranteId, 'O campo "restauranteId" é obrigatório');

  if (!Array.isArray(input.itens) || input.itens.length === 0) {
    throw new ValidationError(Pedido.MENSAGEM_SEM_ITENS);
  }
  const itensBrutos: readonly unknown[] = input.itens;

  const itens = itensBrutos.map((item): ItemSolicitado => {
    if (!ehObjeto(item)) {
      throw new ValidationError('Item do pedido inválido');
    }
    return {
      produtoId: exigirTextoPreenchido(item.produtoId, 'Cada item deve informar o "produtoId"'),
      quantidade: Quantidade.criar(exigirNumero(item.quantidade, Quantidade.MENSAGEM_INVALIDA)),
    };
  });

  return { clienteId, restauranteId, itens };
}
