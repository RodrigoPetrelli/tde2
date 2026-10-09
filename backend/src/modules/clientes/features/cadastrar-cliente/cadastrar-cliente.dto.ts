import { exigirTexto, exigirTextoPreenchido } from '../../../../shared/application/validacao';
import { Cliente } from '../../domain/Cliente';

/** Entrada não confiável (vinda do corpo da requisição). */
export interface CadastrarClienteInput {
  nome?: unknown;
  email?: unknown;
}

export interface CadastrarClienteDados {
  nome: string;
  email: string;
}

/** Valida apenas o formato; o formato do e-mail é regra da entidade Cliente. */
export function validarCadastrarCliente(input: CadastrarClienteInput): CadastrarClienteDados {
  return {
    nome: exigirTextoPreenchido(input.nome, 'O campo "nome" é obrigatório'),
    email: exigirTexto(input.email, Cliente.MENSAGEM_EMAIL_INVALIDO),
  };
}
