import { createContext, useContext, useMemo, useState } from "react";
import { translations } from "../utils/translations";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      t: (key) => translations[language]?.[key] || key
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
};
