
export type Vec2 = [number, number];

export function assert(test: boolean): asserts test {
  if (!test) {
    throw new Error(`Assertion failed. See the stack trace for more information.`);
  }
}

export function sleep(msec: number): Promise<void> {
  return new Promise(accept => {
    setTimeout(accept, msec);
  });
}
