import { Alert, Box } from "@mui/material";
import { withStyles } from "@mui/styles";
import React, { useState, useCallback } from "react";

import Loading from "../components/loading/Loading";

const CenteredAlert = withStyles({
  root: { justifyContent: "center" },
})(Alert);

/**
 * Store to manage page error handling.
 * @param {boolean} startAsLoading should the page initialize in a loading state?
 *
 * Handles the display of a loading indicator when the page is first
 * rendered and an optional error message.
 */
export default function usePageStatus(startAsLoading: any, initialLoadingMessage?: string) {
  // Full page loading indicator
  const [loading, toggleLoading] = useState(!!startAsLoading);
  const [loadingMessage, setLoadingMessage] = useState(initialLoadingMessage || "");
  // Full page error indicator
  const [error, setError] = useState("");

  function setLoading(msg: any) {
    setError("");
    if (msg) {
      setLoadingMessage(msg);
    }
    toggleLoading(true);
  }

  function setSuccess() {
    setError("");
    setLoadingMessage("");
    toggleLoading(false);
  }

  function setFailure(newErr: React.SetStateAction<string>) {
    setError(newErr);
    toggleLoading(false);
  }

  function Display() {
    if (error) {
      return (
        <Box mt={10}>
          <CenteredAlert severity="error">{error}</CenteredAlert>
        </Box>
      );
    }

    if (loading) {
      return (
        <Box mt={10}>
          <Loading positionStatic message={loadingMessage} />
        </Box>
      );
    }

    // Nothing to render
    return null;
  }

  return {
    setLoading,
    setSuccess,
    setFailure,
    Display: useCallback(Display, [loading, error]),
    displayPage: !loading && !error,
  };
}
