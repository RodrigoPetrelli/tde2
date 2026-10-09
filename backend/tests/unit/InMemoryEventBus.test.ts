import { DomainEvent } from '../../src/shared/domain/DomainEvent';
import { InMemoryEventBus } from '../../src/shared/infrastructure/InMemoryEventBus';

const evento = (nome: string): DomainEvent => ({ nome, ocorridoEm: new Date() });

describe('InMemoryEventBus', () => {
  it('entrega o evento a todos os handlers assinados, em ordem', async () => {
    const bus = new InMemoryEventBus();
    const chamadas: string[] = [];
    bus.assinar('a', { handle: async () => void chamadas.push('h1') });
    bus.assinar('a', { handle: async () => void chamadas.push('h2') });
    bus.assinar('b', { handle: async () => void chamadas.push('outro') });

    await bus.publicar([evento('a')]);

    expect(chamadas).toEqual(['h1', 'h2']);
  });

  it('isola a falha de um handler', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const bus = new InMemoryEventBus();
    const chamadas: string[] = [];
    bus.assinar('a', {
      handle: async () => {
        throw new Error('falhou');
      },
    });
    bus.assinar('a', { handle: async () => void chamadas.push('h2') });

    await expect(bus.publicar([evento('a')])).resolves.toBeUndefined();
    expect(chamadas).toEqual(['h2']);
  });
});
