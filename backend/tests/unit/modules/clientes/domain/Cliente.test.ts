import { ValidationError } from '../../../../../src/shared/domain/errors';
import { Cliente } from '../../../../../src/modules/clientes/domain/Cliente';

describe('Cliente (entidade)', () => {
  it('normaliza nome (trim) e e-mail (trim + minúsculas)', () => {
    const criadoEm = new Date('2026-01-01T10:00:00.000Z');

    const cliente = Cliente.criar({ id: '1', nome: ' Maria ', email: ' Maria@Exemplo.COM ' }, criadoEm);

    expect(cliente).toMatchObject({ id: '1', nome: 'Maria', email: 'maria@exemplo.com', criadoEm });
  });

  it.each(['', '   ', 'maria', 'maria@', '@exemplo.com', 'maria@exemplo', 'ma ria@exemplo.com', 'maria@@exemplo.com'])(
    'rejeita o e-mail inválido %p',
    (email) => {
      expect(() => Cliente.criar({ id: '1', nome: 'Maria', email })).toThrow(
        new ValidationError(Cliente.MENSAGEM_EMAIL_INVALIDO),
      );
    },
  );

  it('rejeita nome vazio', () => {
    expect(() => Cliente.criar({ id: '1', nome: '   ', email: 'maria@exemplo.com' })).toThrow(
      new ValidationError('O campo "nome" é obrigatório'),
    );
  });

  it('é comparado pela identidade', () => {
    const a = Cliente.criar({ id: '1', nome: 'Maria', email: 'maria@exemplo.com' });
    const b = Cliente.criar({ id: '1', nome: 'Outra', email: 'outra@exemplo.com' });
    const c = Cliente.criar({ id: '2', nome: 'Maria', email: 'maria@exemplo.com' });

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
