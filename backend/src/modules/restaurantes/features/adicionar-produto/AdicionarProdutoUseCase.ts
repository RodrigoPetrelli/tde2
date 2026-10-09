import { IdGenerator } from '../../../../shared/application/IdGenerator';
import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { paraProdutoDTO, ProdutoDTO } from '../../application/RestaurantesDTO';
import { Produto } from '../../domain/Produto';
import { RestauranteRepository } from '../../domain/RestauranteRepository';
import { AdicionarProdutoInput, validarAdicionarProduto } from './adicionar-produto.dto';

export class AdicionarProdutoUseCase implements UseCase<AdicionarProdutoInput, ProdutoDTO> {
  constructor(
    private readonly restaurantes: RestauranteRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: AdicionarProdutoInput): Promise<ProdutoDTO> {
    // Contrato da API: a existência do restaurante (404) é verificada antes do corpo (400).
    const restaurante = await this.restaurantes.buscarPorId(input.restauranteId);
    if (!restaurante) {
      throw new NotFoundError('Restaurante não encontrado');
    }

    const dados = validarAdicionarProduto(input);
    const produto = Produto.criar({ id: this.ids.gerar(), restauranteId: restaurante.id, ...dados });
    await this.restaurantes.salvarProduto(produto);
    return paraProdutoDTO(produto);
  }
}
