import React from 'react';
import { BrandLogo } from './BrandLogo';
// Compatibility wrapper for old code paths.
export function BrandMark({ size = 92 }) {
  return <BrandLogo size={size} />;
}