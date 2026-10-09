/** Um caso de uso = uma classe com um único método público. */
export interface UseCase<I, O> {
  execute(input: I): Promise<O>;
}
