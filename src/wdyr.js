import React from "react";

if (process.env.NODE_ENV === "development" && process.env.REACT_APP_WDYR === "true") {
  try {
    // eslint-disable-next-line global-require
    const whyDidYouRender = require("@welldone-software/why-did-you-render");
    whyDidYouRender(React, {
      trackAllPureComponents: false,
      trackHooks: true,
      logOnDifferentValues: true,
    });
  } catch {
    // Optional dev dependency — install @welldone-software/why-did-you-render for rerender diagnostics.
  }
}
