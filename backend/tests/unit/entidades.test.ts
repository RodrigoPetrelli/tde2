import { ValidationError } from '../../src/shared/domain/errors';
import { Money } from '../../src/shared/domain/Money';
import { Cliente } from '../../src/modules/clientes/domain/Cliente';
import { Produto } from '../../src/modules/restaurantes/domain/Produto';

describe('Cliente', () => {
  it('normaliza o e-mail (trim + minúsculas)', () => {
    expect(Cliente.criar({ id: '1', nome: ' Maria ', email: ' Maria@Exemplo.COM ' })).toMatchObject({
      nome: 'Maria',
      email: 'maria@exemplo.com',
    });
  });

  it('rejeita e-mail inválido', () => {
    expect(() => Cliente.criar({ id: '1', nome: 'Maria', email: 'maria@' })).toThrow(
      new ValidationError('O campo "email" deve ser um e-mail válido'),
    );
  });
});

describe('Produto', () => {
  it.each([0, -1, 10.5])('rejeita preço %p', (precoCentavos) => {
    expect(() => Produto.criar({ id: '1', restauranteId: 'r', nome: 'X', precoCentavos })).toThrow(ValidationError);
  });

  it('fica disponível por padrão', () => {
    const produto = Produto.criar({ id: '1', restauranteId: 'r', nome: 'X', precoCentavos: 100 });
    expect(produto.disponivel).toBe(true);
    expect(produto.preco.centavos).toBe(100);
  });
});

describe('Money', () => {
  it('opera em centavos inteiros', () => {
    expect(Money.deCentavos(3500).multiplicar(2).somar(Money.deCentavos(790)).centavos).toBe(7790);
    expect(() => Money.deCentavos(1.5)).toThrow(ValidationError);
    expect(() => Money.deCentavos(-1)).toThrow(ValidationError);
  });
});
