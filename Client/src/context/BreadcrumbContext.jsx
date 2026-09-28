import { createContext, useContext, useEffect, useState } from "react";

const BreadcrumbContext = createContext({ label: "", setLabel: () => {} });

export function BreadcrumbProvider({ children }) {
  const [label, setLabel] = useState("");
  return <BreadcrumbContext.Provider value={{ label, setLabel }}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbLabel() {
  return useContext(BreadcrumbContext).label;
}

export function useBreadcrumb(title) {
  const { setLabel } = useContext(BreadcrumbContext);
  useEffect(() => {
    setLabel(title || "");
    return () => setLabel("");
  }, [title, setLabel]);
}
