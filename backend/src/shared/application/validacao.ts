import { ValidationError } from '../domain/errors';

/**
 * Guardas para validar o formato de entradas não confiáveis (ex.: corpo HTTP)
 * antes de convertê-las nos tipos esperados pelo domínio.
 */

export function ehObjeto(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && valor !== null;
}

export function exigirTextoPreenchido(valor: unknown, mensagem: string): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ValidationError(mensagem);
  }
  return valor;
}

export function exigirTexto(valor: unknown, mensagem: string): string {
  if (typeof valor !== 'string') {
    throw new ValidationError(mensagem);
  }
  return valor;
}

export function exigirNumero(valor: unknown, mensagem: string): number {
  if (typeof valor !== 'number') {
    throw new ValidationError(mensagem);
  }
  return valor;
}

export function exigirBooleanoOpcional(valor: unknown, mensagem: string): boolean | undefined {
  if (valor !== undefined && typeof valor !== 'boolean') {
    throw new ValidationError(mensagem);
  }
  return valor;
}
