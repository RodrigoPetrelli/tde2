import { NotFoundError, ValidationError } from '../../../../../../src/shared/domain/errors';
import { Produto } from '../../../../../../src/modules/restaurantes/domain/Produto';
import { Restaurante } from '../../../../../../src/modules/restaurantes/domain/Restaurante';
import { AdicionarProdutoUseCase } from '../../../../../../src/modules/restaurantes/features/adicionar-produto/AdicionarProdutoUseCase';
import { FakeRestauranteRepository, SequentialIdGenerator } from '../../../../fakes';

async function montar() {
  const restaurantes = new FakeRestauranteRepository();
  await restaurantes.salvar(Restaurante.criar({ id: 'r1', nome: 'Cantina', categoria: 'Italiana' }));
  return { restaurantes, useCase: new AdicionarProdutoUseCase(restaurantes, new SequentialIdGenerator('prod')) };
}

describe('AdicionarProdutoUseCase', () => {
  it('adiciona o produto ao cardápio do restaurante, disponível por padrão', async () => {
    const { useCase, restaurantes } = await montar();

    const saida = await useCase.execute({ restauranteId: 'r1', nome: ' Lasanha ', precoCentavos: 3500 });

    expect(saida).toMatchObject({ id: 'prod-1', restauranteId: 'r1', nome: 'Lasanha', precoCentavos: 3500, disponivel: true });
    expect(restaurantes.produtos).toHaveLength(1);
    expect(restaurantes.produtos[0]).toBeInstanceOf(Produto);
  });

  it('respeita disponivel=false', async () => {
    const { useCase } = await montar();

    const saida = await useCase.execute({ restauranteId: 'r1', nome: 'Pizza', precoCentavos: 4000, disponivel: false });

    expect(saida.disponivel).toBe(false);
  });

  it('lança NotFoundError para restaurante inexistente, mesmo com corpo inválido (404 antes de 400)', async () => {
    const { useCase, restaurantes } = await montar();

    await expect(useCase.execute({ restauranteId: 'x', nome: 'Lasanha', precoCentavos: 3500 })).rejects.toThrow(
      new NotFoundError('Restaurante não encontrado'),
    );
    await expect(useCase.execute({ restauranteId: 'x' })).rejects.toBeInstanceOf(NotFoundError);
    expect(restaurantes.produtos).toHaveLength(0);
  });

  it.each([
    ['preço zero', { nome: 'Lasanha', precoCentavos: 0 }, Produto.MENSAGEM_PRECO_INVALIDO],
    ['preço negativo', { nome: 'Lasanha', precoCentavos: -100 }, Produto.MENSAGEM_PRECO_INVALIDO],
    ['preço fracionário', { nome: 'Lasanha', precoCentavos: 10.5 }, Produto.MENSAGEM_PRECO_INVALIDO],
    ['preço não numérico', { nome: 'Lasanha', precoCentavos: '3500' }, Produto.MENSAGEM_PRECO_INVALIDO],
    ['nome ausente', { precoCentavos: 3500 }, 'O campo "nome" é obrigatório'],
    ['disponivel não booleano', { nome: 'Lasanha', precoCentavos: 3500, disponivel: 'sim' }, 'O campo "disponivel" deve ser booleano'],
  ])('rejeita %s com ValidationError sem salvar', async (_caso, corpo, mensagem) => {
    const { useCase, restaurantes } = await montar();

    await expect(useCase.execute({ restauranteId: 'r1', ...corpo })).rejects.toThrow(new ValidationError(mensagem));
    expect(restaurantes.produtos).toHaveLength(0);
  });
});
