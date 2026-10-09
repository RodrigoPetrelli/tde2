import { ValidationError } from '../../../../src/shared/domain/errors';
import { Money } from '../../../../src/shared/domain/Money';

describe('Money', () => {
  it('opera em centavos inteiros', () => {
    expect(Money.deCentavos(3500).multiplicar(2).somar(Money.deCentavos(790)).centavos).toBe(7790);
    expect(Money.zero().centavos).toBe(0);
  });

  it.each([1.5, -1, Number.NaN])('rejeita o valor %p', (centavos) => {
    expect(() => Money.deCentavos(centavos)).toThrow(ValidationError);
  });

  it('é comparado por valor', () => {
    expect(Money.deCentavos(100).equals(Money.deCentavos(100))).toBe(true);
    expect(Money.deCentavos(100).equals(Money.deCentavos(101))).toBe(false);
    expect(Money.deCentavos(1).ehPositivo()).toBe(true);
    expect(Money.zero().ehPositivo()).toBe(false);
  });
});
