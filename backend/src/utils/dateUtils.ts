export function timestring(): string {
  return new Date().toTimeString({timezone: "EDT"});
}