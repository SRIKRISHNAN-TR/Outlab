import { createContext, useContext } from "react";

export const ComposeContext = createContext<{ openCompose: () => void }>({
  openCompose: () => {},
});

export const useCompose = () => useContext(ComposeContext);
