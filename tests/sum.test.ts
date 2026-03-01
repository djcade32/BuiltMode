import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

test("adds 1 + 2 to equal 3", async () => {
  const callableFunction = httpsCallable(functions, "testFunc");
  const response = await callableFunction({ message: "Hello from React!" });
  console.log("response: ", response);
  expect(1 + 2).toBe(3);
});
