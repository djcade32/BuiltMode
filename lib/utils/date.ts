import dayjs from "dayjs";

export const formatFirestoreTimestamp = (timestamp?: { seconds: number; nanoseconds: number }) => {
  if (!timestamp) return "";

  return dayjs.unix(timestamp.seconds).format("MMM DD, YYYY");
};

export const formatFirestoreTime = (timestamp?: { seconds: number; nanoseconds: number }) => {
  if (!timestamp) return "";

  return dayjs.unix(timestamp.seconds).format("h:mm A");
};

export const formatFirestoreDateTimeString = (timestamp?: {
  seconds: number;
  nanoseconds: number;
}) => {
  if (!timestamp) return "";

  return dayjs.unix(timestamp.seconds).format("MMM DD, YYYY • h:mm A");
};

export const formatFirestoreDateTimeISO = (timestamp?: {
  seconds: number;
  nanoseconds: number;
}) => {
  if (!timestamp) return "";

  return dayjs.unix(timestamp.seconds).format("YYYY-MM-DD[T]HH:mm:ssZ");
};

export const getFirestoreMonthSectionLabel = (timestamp?: {
  seconds: number;
  nanoseconds: number;
}) => {
  if (!timestamp) return "UNKNOWN";

  return dayjs.unix(timestamp.seconds).format("MMMM YYYY").toUpperCase();
};

export const getFirestoreDayLabel = (timestamp?: { seconds: number; nanoseconds: number }) => {
  if (!timestamp) return "";

  return dayjs.unix(timestamp.seconds).format("dddd");
};
