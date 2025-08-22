"use client";

import dynamic from 'next/dynamic';

// Dynamically import Card components
const Card = dynamic(() => import('./card').then(mod => mod.Card), { ssr: true });
const CardHeader = dynamic(() => import('./card').then(mod => mod.CardHeader), { ssr: true });
const CardFooter = dynamic(() => import('./card').then(mod => mod.CardFooter), { ssr: true });
const CardTitle = dynamic(() => import('./card').then(mod => mod.CardTitle), { ssr: true });
const CardDescription = dynamic(() => import('./card').then(mod => mod.CardDescription), { ssr: true });
const CardContent = dynamic(() => import('./card').then(mod => mod.CardContent), { ssr: true });

// Export all Card components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };