export function CursorDark({ className }: { className?: string }) {
  return (
    <svg
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ flex: "0 0 auto", lineHeight: 1 }}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>Cursor</title>
      <path
        d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z"
        fill="url(#lobe-icons-cursorundefined-fill-0)"
      ></path>
      <path
        d="M22.35 18V6L11.925 0v12l10.425 6z"
        fill="url(#lobe-icons-cursorundefined-fill-1)"
      ></path>
      <path
        d="M11.925 0L1.5 6v12l10.425-6V0z"
        fill="url(#lobe-icons-cursorundefined-fill-2)"
      ></path>
      <path d="M22.35 6L11.925 24V12L22.35 6z" fill="#E4E4E4"></path>
      <path d="M22.35 6l-10.425 6L1.5 6h20.85z" fill="#FFFFFF"></path>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="lobe-icons-cursorundefined-fill-0"
          x1="11.925"
          x2="11.925"
          y1="12"
          y2="24"
        >
          <stop offset=".16" stopColor="#fff" stopOpacity=".39"></stop>
          <stop offset=".658" stopColor="#fff" stopOpacity=".8"></stop>
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="lobe-icons-cursorundefined-fill-1"
          x1="22.35"
          x2="11.925"
          y1="6.037"
          y2="12.15"
        >
          <stop offset=".182" stopColor="#fff" stopOpacity=".31"></stop>
          <stop offset=".715" stopColor="#fff" stopOpacity="0"></stop>
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="lobe-icons-cursorundefined-fill-2"
          x1="11.925"
          x2="1.5"
          y1="0"
          y2="18"
        >
          <stop stopColor="#fff" stopOpacity=".6"></stop>
          <stop offset=".667" stopColor="#fff" stopOpacity=".22"></stop>
        </linearGradient>
      </defs>
    </svg>
  )
}
