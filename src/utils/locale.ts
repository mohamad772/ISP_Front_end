export const getLocaleWithLatinDigits = (language?: string) => {
  return language?.startsWith("ar") ? "ar-SY-u-nu-latn" : "en-US";
};
