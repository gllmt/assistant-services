export function toOpenClawError(message: string) {
  return {
    error: "IntegrationError",
    message
  };
}
