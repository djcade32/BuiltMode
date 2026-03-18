export async function clearFirestore() {
  const projectId = "demo-builtmode"; // MUST match emulator project
  const response = await fetch(
    `http://localhost:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to clear Firestore emulator: ${response.status} ${response.statusText}`,
    );
  }
}
