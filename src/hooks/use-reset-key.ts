"use client";

import { useState } from "react";

/**
 * Returns a key that changes every time `open` flips to true. Keying a dialog's form
 * with it gives each opening fresh state while preserving the close animation.
 */
export function useResetKey(open: boolean) {
  const [key, setKey] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setKey((k) => k + 1);
  }
  return key;
}
