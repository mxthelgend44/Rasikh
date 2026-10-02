/** Bounded concurrent work, with ordered output and no unhandled promises. */
export async function parallelMap<Input, Output>(
  values: readonly Input[],
  concurrency: number,
  apply: (value: Input, index: number) => Promise<Output>,
): Promise<Output[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16)
    throw new RangeError('concurrency must be an integer from 1 to 16');
  const outputs = new Array<Output>(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (next < values.length) {
        const index = next++;
        outputs[index] = await apply(values[index]!, index);
      }
    }),
  );
  return outputs;
}
