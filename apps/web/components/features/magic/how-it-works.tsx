"use client"

import Image from "next/image"

const steps = [
  {
    title: "Describe Your Vision",
    description:
      "Simply tell the AI Agent what component you need by typing /ui and describing your idea - whether it's a pricing table, contact form, or navigation menu.",
    image: "/how-it-works-1.png",
  },
  {
    title: "Choose from Options",
    description:
      "Magic generates three unique variations of your component. Review them and select the one that best matches your needs and design preferences.",
    image: "/how-it-works-3.png",
  },
  {
    title: "Instant Integration",
    description:
      "Your IDE's AI Agent automatically integrates the chosen component into your project, handling all the necessary files and dependencies seamlessly.",
    image: "/how-it-works-2.png",
  },
]

export function HowItWorks() {
  return (
    <section className="pt-10 pb-10 lg:pb-24 overflow-hidden">
      <div className="text-center">
        <h2 className="text-5xl sm:text-[3.9rem]/16 pb-2 font-bold tracking-tighter text-pretty bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white sm:text-balance">
          How It Works
        </h2>
        <p className="mt-4 text-lg text-neutral-300">
          Create beautiful UI components in three simple steps
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg"
          >
            <div className="relative w-full">
              <div className="relative w-full aspect-[21/5]">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover object-left-top"
                />
              </div>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-neutral-200">
              {step.title}
            </h3>
            <p className="mt-2 text-neutral-400 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
