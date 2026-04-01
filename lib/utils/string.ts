export const firstLetterToUpperCase = (str: string) => {
  if (!str) return str;
  return `${str[0].toLocaleUpperCase()}${str.slice(1)}`;
};
