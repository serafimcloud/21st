import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { defaultGlobalCss, defaultTailwindConfig } from "@/lib/defaults"

interface GenerateFilesOptions {
  componentPath: string
  componentCode: string
  dependencies?: Record<string, string>
  customTailwindConfig?: string | null
  customGlobalCss?: string | null
}

export function generateSandpackFiles({
  componentPath,
  componentCode,
  dependencies = {},
  customTailwindConfig = null,
  customGlobalCss = null,
}: GenerateFilesOptions): SandpackFiles {
  const files: SandpackFiles = {
    [componentPath]: {
      code: componentCode,
    },
    "/package.json": {
      code: JSON.stringify(
        {
          name: "component-project",
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "@radix-ui/react-select": "^2.0.0",
            "lucide-react": "^0.363.0",
            clsx: "^2.1.0",
            "tailwind-merge": "^2.1.0",
            ...dependencies,
          },
        },
        null,
        2,
      ),
    },
    "/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Component Preview</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    },
    "/index.tsx": {
      code: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
    },
    "/globals.css": {
      code: customGlobalCss || defaultGlobalCss,
    },
    "/tsconfig.json": {
      code: JSON.stringify(
        {
          compilerOptions: {
            jsx: "react-jsx",
            esModuleInterop: true,
            baseUrl: ".",
            paths: {
              "@/*": ["./*"],
            },
          },
        },
        null,
        2,
      ),
    },
    "/next-themes.tsx": {
      code: `import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: (theme: string) => {},
  resolvedTheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children, defaultTheme = 'light', enableSystem = false, attribute = 'data-theme' }) => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (attribute === 'class') {
      // If attribute is class, add theme as a class
      root.classList.add(theme);
    } else {
      // Otherwise set it as a data attribute
      root.setAttribute(attribute, theme);
    }
  }, [theme, attribute]);

  const resolvedTheme = theme === 'system' ? 'light' : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};`,
    },
    "/lib/utils.ts": {
      code: `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,
    },
    "/tailwind.config.js": {
      code: customTailwindConfig || defaultTailwindConfig,
    },
    "/node_modules/next/package.json": {
      code: `{
  "name": "next",
  "version": "latest",
  "main": "index.js"
}`,
    },
    "/node_modules/next/index.js": {
      code: `export { default as Image } from './image';
export { default as Link } from './link';
export { useRouter, RouterProvider, usePathname } from './router';
export { default as Head } from './head';
export { default as Script } from './script';
export { default as dynamic } from './dynamic';
export { Roboto } from './font';
export { default as Document } from './document';`,
    },
    "/node_modules/next/image.js": {
      code: `import React from 'react';
      
const Image = ({ src, alt, width, height, ...props }) => (
  <img src={src} alt={alt} width={width} height={height} {...props} />
);

export default Image;`,
    },
    "/node_modules/next/link.js": {
      code: `import React from 'react';
      
const Link = ({ href, children, ...props }) => (
  <a href={href} {...props}>{children}</a>
);

export default Link;`,
    },
    "/node_modules/next/head.js": {
      code: `import React from 'react';
      
const Head = ({ children }) => {
  return <div>{children}</div>;
};

export default Head;`,
    },
    "/node_modules/next/script.js": {
      code: `import React from 'react';
      
const Script = ({ src, strategy, children, ...props }) => {
  return <script src={src} {...props}>{children}</script>;
};

export default Script;`,
    },
    "/node_modules/next/router.js": {
      code: `import React, { createContext, useContext } from 'react';
      
const RouterContext = createContext({
  pathname: '/',
  push: (url) => {},
  replace: (url) => {},
});

export const useRouter = () => useContext(RouterContext);

export const usePathname = () => {
  const router = useRouter();
  return router.pathname;
};

export const RouterProvider = ({ children }) => {
  const router = {
    pathname: '/',
    push: (url) => {},
    replace: (url) => {},
  };
  
  return (
    <RouterContext.Provider value={router}>
      {children}
    </RouterContext.Provider>
  );
};`,
    },
    "/node_modules/next/dynamic.js": {
      code: `import React, { Suspense } from 'react';
      
const dynamic = (importFunc, options = {}) => {
  const { ssr = true, loading: LoadingComponent = () => <div>Loading...</div> } = options;
  
  const LazyComponent = React.lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default dynamic;`,
    },
    "/node_modules/next/font.js": {
      code: `export const Roboto = {
  className: 'font-roboto',
};`,
    },
    "/node_modules/next/document.js": {
      code: `import React from 'react';

const Html = ({ children, ...props }) => <html {...props}>{children}</html>;
const Head = ({ children }) => <head>{children}</head>;
const Main = () => <div id="__next"></div>;
const NextScript = () => <script />;

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}`,
    },
    "/node_modules/next/navigation.js": {
      code: `export { usePathname } from './router';`,
    },
  }

  return files
}
