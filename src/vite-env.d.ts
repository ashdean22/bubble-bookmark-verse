/// <reference types="vite/client" />

// Declare static asset types so TypeScript resolves them without errors
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.avif' {
  const src: string;
  export default src;
}
