import { handleTestFunc } from "./testFunc.js";

describe("handleTestFunc", () => {
  test("returns the message when provided", () => {
    const res = handleTestFunc({ message: "Hello World" });
    expect(res).toEqual({
      status: "success",
      receivedMessage: "Hello World",
    });
  });

  test("returns undefined when message missing", () => {
    const res = handleTestFunc({});
    expect(res).toEqual({
      status: "success",
      receivedMessage: undefined,
    });
  });

  test("handles non-object input safely", () => {
    const res = handleTestFunc("nope");
    expect(res).toEqual({
      status: "success",
      receivedMessage: undefined,
    });
  });
});
