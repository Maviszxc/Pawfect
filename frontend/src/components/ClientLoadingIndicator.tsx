"use client";

import dynamic from 'next/dynamic';

// Dynamically import GlobalLoadingIndicator with SSR disabled
const GlobalLoadingIndicator = dynamic(
  () => import('./GlobalLoadingIndicator'),
  { ssr: false }
);

export default function ClientLoadingIndicator() {
  return <GlobalLoadingIndicator />;
}