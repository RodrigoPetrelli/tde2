import { IdGenerator } from '../../../../shared/application/IdGenerator';
import { UseCase } from '../../../../shared/application/UseCase';
import { paraRestauranteDTO, RestauranteDTO } from '../../application/RestaurantesDTO';
import { Restaurante } from '../../domain/Restaurante';
import { RestauranteRepository } from '../../domain/RestauranteRepository';
import { CadastrarRestauranteInput, validarCadastrarRestaurante } from './cadastrar-restaurante.dto';

export class CadastrarRestauranteUseCase implements UseCase<CadastrarRestauranteInput, RestauranteDTO> {
  constructor(
    private readonly restaurantes: RestauranteRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CadastrarRestauranteInput): Promise<RestauranteDTO> {
    const dados = validarCadastrarRestaurante(input);
    const restaurante = Restaurante.criar({ id: this.ids.gerar(), ...dados });
    await this.restaurantes.salvar(restaurante);
    return paraRestauranteDTO(restaurante);
  }
}
