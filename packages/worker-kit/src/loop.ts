export async function runLoop(
  name: string,
  intervalMs: number,
  tick: () => Promise<void>,
): Promise<void> {
  const run = async () => {
    try {
      await tick();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${name}] tick failed: ${message}`);
    }
  };

  await run();
  setInterval(() => {
    void run();
  }, intervalMs);
}
