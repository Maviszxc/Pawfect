"use client";

import dynamic from 'next/dynamic';

// Dynamically import Button component
const Button = dynamic(() => import('./button').then(mod => mod.Button), { ssr: true });
const buttonVariants = dynamic(() => import('./button').then(mod => mod.buttonVariants), { ssr: false });

// Export Button component and its variants
export { Button, buttonVariants };