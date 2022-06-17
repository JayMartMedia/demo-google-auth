export function timestring(): string {
  // @ts-ignore
  return new Date().toTimeString({timezone: "EDT"});
}