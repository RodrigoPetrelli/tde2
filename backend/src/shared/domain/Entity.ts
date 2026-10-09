/** Entidade: possui identidade própria e é comparada pelo id. */
export abstract class Entity {
  protected constructor(public readonly id: string) {}

  equals(outra?: Entity): boolean {
    return outra !== undefined && outra.constructor === this.constructor && outra.id === this.id;
  }
}
