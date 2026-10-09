import { ValidationError } from './errors';

/** Valor monetário imutável representado em centavos inteiros (evita erros de ponto flutuante). */
export class Money {
  private constructor(public readonly centavos: number) {}

  static deCentavos(centavos: number): Money {
    if (!Number.isInteger(centavos) || centavos < 0) {
      throw new ValidationError('Valor monetário deve ser um inteiro não negativo em centavos');
    }
    return new Money(centavos);
  }

  static zero(): Money {
    return new Money(0);
  }

  somar(outro: Money): Money {
    return new Money(this.centavos + outro.centavos);
  }

  multiplicar(fator: number): Money {
    return Money.deCentavos(this.centavos * fator);
  }

  ehPositivo(): boolean {
    return this.centavos > 0;
  }

  equals(outro: Money): boolean {
    return this.centavos === outro.centavos;
  }
}
