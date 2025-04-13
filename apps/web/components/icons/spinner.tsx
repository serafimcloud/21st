import React from "react"

interface SpinnerProps {
  size?: number
  color?: string
}

const bars = [
  {
    animationDelay: "-0.1s",
    transform: "rotate(.0001deg) translate(146%)",
  },
  {
    animationDelay: "-1.2s",
    transform: "rotate(30deg) translate(146%)",
  },
  {
    animationDelay: "-1.1s",
    transform: "rotate(60deg) translate(146%)",
  },
  {
    animationDelay: "-1.0s",
    transform: "rotate(90deg) translate(146%)",
  },
  {
    animationDelay: "-0.9s",
    transform: "rotate(120deg) translate(146%)",
  },
  {
    animationDelay: "-0.8s",
    transform: "rotate(150deg) translate(146%)",
  },
  {
    animationDelay: "-0.7s",
    transform: "rotate(180deg) translate(146%)",
  },
  {
    animationDelay: "-0.6s",
    transform: "rotate(210deg) translate(146%)",
  },
  {
    animationDelay: "-0.5s",
    transform: "rotate(240deg) translate(146%)",
  },
  {
    animationDelay: "-0.4s",
    transform: "rotate(270deg) translate(146%)",
  },
  {
    animationDelay: "-0.3s",
    transform: "rotate(300deg) translate(146%)",
  },
  {
    animationDelay: "-0.2s",
    transform: "rotate(330deg) translate(146%)",
  },
]

export const Spinner = ({ size = 20, color = "#8f8f8f" }: SpinnerProps) => {
  return (
    <div style={{ width: size, height: size }}>
      <style jsx>
        {`
          @keyframes spin {
            0% {
              opacity: 1;
            }
            100% {
              opacity: 0.15;
            }
          }
        `}
      </style>
      <div
        className="relative top-1/2 left-1/2"
        style={{ width: size, height: size }}
      >
        {bars.map((item) => (
          <div
            key={item.transform}
            className="absolute h-[8%] w-[24%] -left-[10%] -top-[3.9%] rounded-[5px]"
            style={{
              backgroundColor: color,
              animation: "spin 1.2s linear infinite",
              ...item,
            }}
          />
        ))}
      </div>
    </div>
  )
}
