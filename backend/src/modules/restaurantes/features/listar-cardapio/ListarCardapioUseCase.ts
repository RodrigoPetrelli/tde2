import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { paraProdutoDTO, ProdutoDTO } from '../../application/RestaurantesDTO';
import { RestauranteRepository } from '../../domain/RestauranteRepository';

export interface ListarCardapioInput {
  restauranteId: string;
}

export class ListarCardapioUseCase implements UseCase<ListarCardapioInput, ProdutoDTO[]> {
  constructor(private readonly restaurantes: RestauranteRepository) {}

  async execute(input: ListarCardapioInput): Promise<ProdutoDTO[]> {
    const restaurante = await this.restaurantes.buscarPorId(input.restauranteId);
    if (!restaurante) {
      throw new NotFoundError('Restaurante não encontrado');
    }
    const produtos = await this.restaurantes.listarProdutosDoRestaurante(restaurante.id);
    return produtos.map(paraProdutoDTO);
  }
}
