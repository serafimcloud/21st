"use client"

import { MessageSquare, Code2, FileCode } from "lucide-react"

const steps = [
  {
    title: "Tell Agent What You Need",
    description:
      "In your AI Agent's chat, just type /ui and describe the component you're looking for—maybe a waitlist form or a login page.",
    icon: MessageSquare,
  },
  {
    title: "Let Magic Create It",
    description:
      "Your IDE (e.g., Cursor) prompts you to use Magic. Magic then instantly builds a polished UI component, inspired by 21st.dev's library.",
    icon: Code2,
  },
  {
    title: "Seamless Integration",
    description:
      "With a single click, Magic adds the new files directly into your project, so you can start using your brand-new UI right away.",
    icon: FileCode,
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-200 sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-4 text-lg text-neutral-300">
          Create beautiful UI components in three simple steps
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-white/20"
            >
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-neutral-200">
                  <Icon className="h-7 w-7" />
                </div>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-neutral-200">
                {step.title}
              </h3>
              <p className="mt-2 text-neutral-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
