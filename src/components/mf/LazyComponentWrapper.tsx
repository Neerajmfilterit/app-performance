"use client";
import React, { Suspense, ReactNode } from "react";

interface LazyComponentWrapperProps {
  children: ReactNode;
  delay?: number;
}

export default function LazyComponentWrapper({
  children,
  delay = 0,
}: LazyComponentWrapperProps) {
  return (
    <div
      style={{
        animation: `fadeIn 0.6s ease-out ${delay}s both`,
      }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}

