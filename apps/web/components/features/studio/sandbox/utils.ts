export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export const getMonacoLanguage = (filename: string) => {
  const ext = getFileExtension(filename).toLowerCase()

  switch (ext) {
    case "js":
      return "javascript"
    case "jsx":
      return "javascript"
    case "ts":
      return "typescript"
    case "tsx":
      return "typescript"
    case "html":
    case "htm":
    case "svg":
    case "xml":
      return "html"
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "css"
    case "json":
      return "json"
    default:
      return "javascript"
  }
}
