import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { resources } from "@/i18n/translations";

const DEFAULT_LANGUAGE = "ar";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ["ar", "en"],
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
  });

const applyDirection = (lng: string) => {
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
};

applyDirection(i18n.language || DEFAULT_LANGUAGE);
i18n.on("languageChanged", applyDirection);

export default i18n;
