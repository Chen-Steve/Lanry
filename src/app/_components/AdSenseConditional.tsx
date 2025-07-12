"use client";
import { useIsPWA } from "@/hooks/useIsPWA";
import AdSenseScript from "./AdSenseScript";

export default function AdSenseConditional() {
  const isPWA = useIsPWA();
  if (isPWA) return null;
  return <AdSenseScript />;
} 