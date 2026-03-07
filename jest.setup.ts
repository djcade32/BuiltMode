jest.mock("react-native-mmkv", () => {
  const store = new Map<string, string>();

  return {
    createMMKV: () => ({
      set: (key: string, value: string | number | boolean) => {
        store.set(key, String(value));
      },
      getString: (key: string) => {
        return store.has(key) ? store.get(key)! : undefined;
      },
      getNumber: (key: string) => {
        const value = store.get(key);
        return value != null ? Number(value) : undefined;
      },
      getBoolean: (key: string) => {
        const value = store.get(key);
        return value != null ? value === "true" : undefined;
      },
      delete: (key: string) => {
        store.delete(key);
      },
      clearAll: () => {
        store.clear();
      },
      contains: (key: string) => store.has(key),
    }),
  };
});
