import { useContext } from "react";
import { PosAppDataContext } from "../PosAppDataProvider";

export function usePosWorkspaceData() {
  const ctx = useContext(PosAppDataContext);
  if (!ctx) {
    throw new Error("usePosWorkspaceData requires PosAppDataProvider");
  }
  return ctx;
}
