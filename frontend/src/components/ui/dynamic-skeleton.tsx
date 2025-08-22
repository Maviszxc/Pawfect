"use client";

import dynamic from 'next/dynamic';

// Dynamically import Skeleton component
const Skeleton = dynamic(() => import('./skeleton').then(mod => mod.Skeleton), { ssr: true });

// Export Skeleton component
export { Skeleton };