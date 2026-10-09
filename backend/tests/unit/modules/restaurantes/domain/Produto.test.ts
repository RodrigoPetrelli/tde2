import { ValidationError } from '../../../../../src/shared/domain/errors';
import { Produto } from '../../../../../src/modules/restaurantes/domain/Produto';

const props = { id: '1', restauranteId: 'r1', nome: 'Lasanha', precoCentavos: 3500 };

describe('Produto (entidade)', () => {
  it.each([0, -1, -3500, 10.5, Number.NaN])('rejeita preço %p (deve ser inteiro > 0)', (precoCentavos) => {
    expect(() => Produto.criar({ ...props, precoCentavos })).toThrow(
      new ValidationError(Produto.MENSAGEM_PRECO_INVALIDO),
    );
  });

  it('aceita o menor preço válido (1 centavo)', () => {
    expect(Produto.criar({ ...props, precoCentavos: 1 }).preco.centavos).toBe(1);
  });

  it('rejeita nome vazio', () => {
    expect(() => Produto.criar({ ...props, nome: '  ' })).toThrow(new ValidationError('O campo "nome" é obrigatório'));
  });

  it('fica disponível por padrão e respeita disponivel=false', () => {
    expect(Produto.criar(props).disponivel).toBe(true);
    expect(Produto.criar({ ...props, disponivel: false }).disponivel).toBe(false);
  });

  it('sabe a qual restaurante pertence', () => {
    const produto = Produto.criar({ ...props, nome: ' Lasanha ' });

    expect(produto.nome).toBe('Lasanha');
    expect(produto.pertenceAo('r1')).toBe(true);
    expect(produto.pertenceAo('r2')).toBe(false);
  });
});
