import endent from "endent"

export const editorHTML = endent`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>React + Tailwind Bundler</title>
      <script src="https://unpkg.com/monaco-editor@latest/min/vs/loader.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .editor-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .preview-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #editor, #dependencies {
          height: 400px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        #dependencies {
          height: 100px;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        input[type="text"], select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        button:hover {
          background: #0051cc;
        }
        iframe {
          width: 100%;
          height: 500px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .error {
          color: #dc2626;
          margin-top: 0.5rem;
        }
        .controls {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }
        .controls .form-group {
          flex: 1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="editor-container">
          <div class="controls">
            <div class="form-group">
              <label for="id">Page ID:</label>
              <input type="text" id="id" placeholder="Enter a unique ID (alphanumeric, hyphens, underscores)">
            </div>
            <div class="form-group">
              <input type="hidden" id="bundler" value="vite">
            </div>
          </div>
          <div class="form-group">
            <label for="editor">React Component:</label>
            <div id="editor"></div>
          </div>
          <div class="form-group">
            <label for="dependencies">Dependencies (JSON format):</label>
            <div id="dependencies"></div>
          </div>
          <button onclick="handleSubmit()">Bundle & Preview</button>
          <div id="error" class="error"></div>
        </div>
        <div class="preview-container">
          <h2>Preview:</h2>
          <iframe id="preview"></iframe>
        </div>
      </div>
      
      <script>
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@latest/min/vs' }});
        require(['vs/editor/editor.main'], function() {
          window.editor = monaco.editor.create(document.getElementById('editor'), {
            value: \`export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-600">
        Hello World!
      </h1>
    </div>
  )
}\`,
            language: 'typescript',
            theme: 'vs-light',
            minimap: { enabled: false }
          });

          window.dependenciesEditor = monaco.editor.create(document.getElementById('dependencies'), {
            value: \`{
  // Add your npm dependencies here
  // "package-name": "version"
}\`,
            language: 'json',
            theme: 'vs-light',
            minimap: { enabled: false }
          });
        });

        async function handleSubmit() {
          const code = window.editor.getValue();
          const id = document.getElementById('id').value;
          const bundler = document.getElementById('bundler').value;
          const dependenciesStr = window.dependenciesEditor.getValue();
          const errorDiv = document.getElementById('error');
          const preview = document.getElementById('preview');
          
          let dependencies;
          try {
            const cleanJson = dependenciesStr.replace(/\\s*\\/\\/.*$/gm, '');
            dependencies = JSON.parse(cleanJson);
          } catch (error) {
            errorDiv.textContent = 'Invalid dependencies JSON: ' + error.message;
            return;
          }
          
          try {
            const response = await fetch('/bundle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, id, dependencies, bundler })
            });
            
            const result = await response.json();
            
            if (result.success) {
              preview.src = '/bundled-page?id=' + id;
              errorDiv.textContent = '';
            } else {
              errorDiv.textContent = result.details || result.error;
            }
          } catch (error) {
            errorDiv.textContent = 'Failed to bundle: ' + error.message;
          }
        }
      </script>
    </body>
  </html>
`
