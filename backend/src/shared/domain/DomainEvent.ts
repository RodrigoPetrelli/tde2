/** Fato relevante que aconteceu no domínio. */
export interface DomainEvent {
  readonly nome: string;
  readonly ocorridoEm: Date;
}
