import fetch from "node-fetch";

export async function clearFirestore() {
  const projectId = "demo-builtmode"; // MUST match emulator project
  await fetch(
    `http://localhost:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    {
      method: "DELETE",
    },
  );
}
