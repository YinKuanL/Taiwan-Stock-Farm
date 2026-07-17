"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

const subscribe = () => () => undefined;

export function useHydrationSafeReducedMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated && Boolean(prefersReducedMotion);
}

