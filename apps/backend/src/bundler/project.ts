import fs from "fs/promises"
import path from "path"
import { BundleOptions } from "./types"

export const createTempProject = async (options: BundleOptions) => {
  const tempDir = path.join(".", `react-bundle-${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })

  try {
    await createPackageJson(tempDir, options.dependencies)
    await createNextModules(tempDir)
    await createSourceFiles(tempDir, options.files)
    await createIndexHtml(tempDir, options.bundledCss)

    if (options.tailwindConfig) {
      await fs.writeFile(
        path.join(tempDir, "tailwind.config.js"),
        options.tailwindConfig,
      )
    }

    if (options.globalCss) {
      await fs.writeFile(path.join(tempDir, "globals.css"), options.globalCss)
    }

    await installDependencies(tempDir)

    return tempDir
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

async function createPackageJson(
  tempDir: string,
  dependencies?: Record<string, string>,
) {
  const packageJson = {
    name: "temp-bundle",
    private: true,
    type: "module",
    dependencies: {
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "next-themes": "^0.4.4",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      ...(dependencies || {}),
    },
  }

  await fs.writeFile(
    path.join(tempDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  )
}

async function createNextModules(tempDir: string) {
  const nextModules = {
    "index.js": `
      export { default as Image } from './image.jsx';
      export { default as Link } from './link.jsx';
      export { useRouter, RouterProvider, usePathname } from './router.jsx';
      export { default as Head } from './head.jsx';
      export { default as Script } from './script.jsx';
      export { default as dynamic } from './dynamic.jsx';
      export { Roboto } from './font.js';
      export { default as Document } from './document.jsx';
    `,
    "image.jsx": `
      import * as React from 'react';
      const Image = ({ src, alt, width, height, ...props }) => (
        <img src={src} alt={alt} width={width} height={height} {...props} />
      );
      export default Image;
    `,
    "link.jsx": `
      import * as React from 'react';
      const Link = ({ href, children, ...props }) => (
        <a href={href} {...props}>{children}</a>
      );
      export default Link;
    `,
    "head.jsx": `
      import * as React from 'react';
      const Head = ({ children }) => {
        return <div>{children}</div>;
      };
      export default Head;
    `,
    "script.jsx": `
      import * as React from 'react';
      const Script = ({ src, strategy, children, ...props }) => {
        return <script src={src} {...props}>{children}</script>;
      };
      export default Script;
    `,
    "router.jsx": `
      import * as React from 'react';
      const RouterContext = React.createContext({
        pathname: '/',
        push: (url) => {},
        replace: (url) => {},
      });
      export const useRouter = () => React.useContext(RouterContext);
      export const usePathname = () => {
        const router = useRouter();
        return router.pathname;
      };
      export const RouterProvider = ({ children }) => {
        const router = {
          pathname: '/',
          push: (url) => {
            console.log(\`Navigating to \${url}\`);
          },
          replace: (url) => {
            console.log(\`Replacing with \${url}\`);
          },
        };
        return React.createElement(RouterContext.Provider, { value: router }, children);
      };
    `,
    "dynamic.jsx": `
      import * as React from 'react';
      const dynamic = (importFunc, options = {}) => {
        const { ssr = true, loading: LoadingComponent = () => React.createElement('div', null, 'Loading...') } = options;
        const LazyComponent = React.lazy(importFunc);
        return (props) => React.createElement(
          React.Suspense,
          { fallback: React.createElement(LoadingComponent) },
          React.createElement(LazyComponent, props)
        );
      };
      export default dynamic;
    `,
    "font.js": `
      export const Roboto = {
        className: 'font-roboto',
      };
    `,
    "document.jsx": `
      import * as React from 'react';
      const Html = ({ children, ...props }) => React.createElement('html', props, children);
      const Head = ({ children }) => React.createElement('head', null, children);
      const Main = () => React.createElement('div', { id: '__next' });
      const NextScript = () => React.createElement('script');
      
      export default function Document() {
        return React.createElement(
          Html,
          null,
          React.createElement(Head),
          React.createElement(
            'body',
            null,
            React.createElement(Main),
            React.createElement(NextScript)
          )
        );
      }
    `,
    "navigation.js": `
      export { usePathname } from './router.jsx';
    `,
    "package.json": `{
      "name": "next",
      "version": "latest",
      "type": "module",
      "main": "index.js"
    }`,
  }

  const nextModulesDir = path.join(tempDir, "node_modules", "next")
  await fs.mkdir(nextModulesDir, { recursive: true })

  await Promise.all(
    Object.entries(nextModules).map(([filename, content]) =>
      fs.writeFile(path.join(nextModulesDir, filename), content),
    ),
  )
}

async function createSourceFiles(
  tempDir: string,
  files: Record<string, string>,
) {
  await Promise.all(
    Object.entries(files).map(([filePath, content]) => {
      const fullPath = path.join(tempDir + "/src", filePath)
      const dirPath = path.dirname(fullPath)
      return fs
        .mkdir(dirPath, { recursive: true })
        .then(() => fs.writeFile(fullPath, content))
    }),
  )
}

async function createIndexHtml(tempDir: string, bundledCss?: string) {
  const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
    ${bundledCss ? `<style>${bundledCss}</style>` : ""}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`

  await fs.writeFile(path.join(tempDir, "index.html"), indexHtml)
}

async function installDependencies(tempDir: string) {
  const installProcess = Bun.spawn(["bun", "install"], {
    cwd: tempDir,
    stderr: "pipe",
  })

  const exitCode = await installProcess.exited
  const output = await new Response(installProcess.stderr).text()

  if (exitCode !== 0) {
    throw new Error(`Failed to install dependencies: ${output}`)
  }
}
