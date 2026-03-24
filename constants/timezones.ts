export type TimezoneOption = {
  id: string;
  label: string;
  subtitle: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  {
    id: "America/New_York",
    label: "United States - Eastern Time",
    subtitle: "UTC - 5 / -4",
  },
  {
    id: "America/Chicago",
    label: "United States - Central Time",
    subtitle: "UTC - 6 / -5",
  },
  {
    id: "America/Denver",
    label: "United States - Mountain Time",
    subtitle: "UTC - 7 / -6",
  },
  {
    id: "America/Los_Angeles",
    label: "United States - Pacific Time",
    subtitle: "UTC - 8 / -7",
  },
  {
    id: "America/Anchorage",
    label: "United States - Alaska Time",
    subtitle: "UTC - 9 / -8",
  },
  {
    id: "Pacific/Honolulu",
    label: "United States - Hawaii Time",
    subtitle: "UTC - 10",
  },
  {
    id: "Europe/London",
    label: "United Kingdom - London",
    subtitle: "UTC + 0 / +1",
  },
  {
    id: "Europe/Paris",
    label: "France - Paris",
    subtitle: "UTC + 1 / +2",
  },
  {
    id: "Europe/Berlin",
    label: "Germany - Berlin",
    subtitle: "UTC + 1 / +2",
  },
  {
    id: "Asia/Tokyo",
    label: "Japan - Tokyo",
    subtitle: "UTC + 9",
  },
  {
    id: "Asia/Shanghai",
    label: "China - Shanghai",
    subtitle: "UTC + 8",
  },
  {
    id: "Asia/Kolkata",
    label: "India - Kolkata",
    subtitle: "UTC + 5:30",
  },
  {
    id: "Australia/Sydney",
    label: "Australia - Sydney",
    subtitle: "UTC + 10 / +11",
  },
];
