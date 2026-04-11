// ======================
// Storage
// ======================

jest.mock("react-native-mmkv", () => {
  const store = new Map<string, string>();
  const resetMockStore = () => store.clear();

  return {
    __resetMockStore: resetMockStore,
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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// ======================
// UI / Expo
// ======================

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: "MaterialIcons",
  Entypo: "Entypo",
  FontAwesome6: "FontAwesome6",
  FontAwesome5: "FontAwesome5",
  Ionicons: "Ionicons",
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

// ======================
// Popup Menu (fixes your error)
// ======================

jest.mock("react-native-popup-menu", () => {
  const React = require("react");
  const { View, Pressable } = require("react-native");

  return {
    MenuProvider: ({ children }: any) => <View>{children}</View>,
    Menu: ({ children }: any) => <View>{children}</View>,
    MenuOptions: ({ children }: any) => <View>{children}</View>,
    MenuOption: ({ children, onSelect }: any) => (
      <Pressable onPress={onSelect}>{children}</Pressable>
    ),
    MenuTrigger: ({ children, onPress }: any) => (
      <Pressable onPress={onPress}>{children}</Pressable>
    ),
    renderers: {
      ContextMenu: "ContextMenu",
    },
  };
});

// ======================
// Firebase
// ======================

jest.mock("firebase/app", () => ({
  getApp: jest.fn(() => ({ name: "[DEFAULT]" })),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(() => ({ name: "[DEFAULT]" })),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
  connectAuthEmulator: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
  OAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  connectFirestoreEmulator: jest.fn(),
  persistentLocalCache: jest.fn(),
  initializeFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => "mock-server-timestamp"),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(),
  })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => date),
  },
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => ({})),
  connectFunctionsEmulator: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  app: {},
  auth: {},
  db: {},
  functions: {},
  storage: {},
}));

jest.mock("@/services/workout-service", () => ({
  createCompleteWorkout: jest.fn(),
}));

// ======================
// Component Mocks (Workout Flow)
// ======================

jest.mock("@/components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock("@/components/themed-view", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock("@/components/ui/ThemedButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return ({ title, onPress, disabled, ...props }: any) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      {...props}
    >
      <Text>{title}</Text>
    </Pressable>
  );
});

jest.mock("@/components/workout/AddExerciseSheet", () => {
  const React = require("react");
  const { View, Pressable, Text } = require("react-native");

  return ({ visible, onSelect, onClose }: any) =>
    visible ? (
      <View>
        <Pressable
          onPress={() =>
            onSelect({
              id: "exercise-sheet-1",
              name: "Sheet Exercise",
              metricType: "weight_reps",
              sets: [{ id: "set-1", weight: 100, reps: 10 }],
            })
          }
        >
          <Text>SELECT_EXERCISE</Text>
        </Pressable>

        <Pressable onPress={onClose}>
          <Text>CLOSE_SHEET</Text>
        </Pressable>
      </View>
    ) : null;
});

jest.mock("@/components/workout/BuildExerciseItem", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return ({ exercise }: any) => (
    <View>
      <Text>{exercise.name}</Text>
    </View>
  );
});

jest.mock("@/components/workout/CurrentWorkoutCard", () => {
  const React = require("react");
  const { View, Pressable, Text } = require("react-native");

  return ({ exercise, onExerciseComplete }: any) => (
    <View>
      <Text>{exercise.name}</Text>
      <Pressable onPress={() => onExerciseComplete(exercise)}>
        <Text>COMPLETE_CURRENT_EXERCISE</Text>
      </Pressable>
    </View>
  );
});

jest.mock("@/components/workout/NextExerciseItem", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return ({ exercise, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{exercise.name}</Text>
    </Pressable>
  );
});

jest.mock("@/components/workout/StopwatchDisplay", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    StopwatchDisplay: ({ hours, minutes, seconds }: any) => (
      <Text>{`${hours}:${minutes}:${seconds}`}</Text>
    ),
  };
});

// ======================
// Reanimated
// ======================

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});
