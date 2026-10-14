import { FunctionalComponent, h } from '@stencil/core';

/** The favicon mark; colours come from the theme, so it adapts to dark mode. */
export const LogoMark: FunctionalComponent<{ size?: number }> = ({ size = 32 }) => (
  <svg class="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="7" />
    <path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" />
  </svg>
);
