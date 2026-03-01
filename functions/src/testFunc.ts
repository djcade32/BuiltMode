export function handleTestFunc(data: unknown) {
  const message =
    typeof data === "object" && data !== null && "message" in data
      ? (data as any).message
      : undefined;

  return {
    status: "success" as const,
    receivedMessage: message,
  };
}
