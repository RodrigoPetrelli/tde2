import { exigirTextoPreenchido } from '../../../../shared/application/validacao';

/** Entrada não confiável (vinda do corpo da requisição). */
export interface CadastrarRestauranteInput {
  nome?: unknown;
  categoria?: unknown;
}

export interface CadastrarRestauranteDados {
  nome: string;
  categoria: string;
}

export function validarCadastrarRestaurante(input: CadastrarRestauranteInput): CadastrarRestauranteDados {
  return {
    nome: exigirTextoPreenchido(input.nome, 'O campo "nome" é obrigatório'),
    categoria: exigirTextoPreenchido(input.categoria, 'O campo "categoria" é obrigatório'),
  };
}
