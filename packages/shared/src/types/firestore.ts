export type firestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
};

export type firestoreTimestampV2 = {
  _seconds: number;
  _nanoseconds: number;
};
