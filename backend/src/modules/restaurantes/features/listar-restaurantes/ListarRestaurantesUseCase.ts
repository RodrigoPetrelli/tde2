import { UseCase } from '../../../../shared/application/UseCase';
import { paraRestauranteDTO, RestauranteDTO } from '../../application/RestaurantesDTO';
import { RestauranteRepository } from '../../domain/RestauranteRepository';

export class ListarRestaurantesUseCase implements UseCase<void, RestauranteDTO[]> {
  constructor(private readonly restaurantes: RestauranteRepository) {}

  async execute(): Promise<RestauranteDTO[]> {
    const restaurantes = await this.restaurantes.listarTodos();
    return restaurantes.map(paraRestauranteDTO);
  }
}
