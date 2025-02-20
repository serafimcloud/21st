"use client"

import { motion, AnimatePresence } from "motion/react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How does Magic AI Agent handle my codebase?",
    answer:
      "Magic AI Agent only writes or modifies files related to the components it generates. It follows your project's code style and structure, and integrates seamlessly with your existing codebase without affecting other parts of your application.",
  },
  {
    question: "Can I customize the generated components?",
    answer:
      "Yes! All generated components are fully editable and come with well-structured code. You can modify the styling, functionality, and behavior just like any other React component in your codebase.",
  },
  {
    question: "What happens if I run out of generations?",
    answer:
      "If you exceed your monthly generation limit, you'll be prompted to upgrade your plan. You can upgrade at any time to continue generating components. Your existing components will remain fully functional.",
  },
  {
    question: "How soon do new components get added to 21st.dev's library?",
    answer:
      "Authors can publish components to 21st.dev at any time, and Magic Agent will have immediate access to them. This means you'll always have access to the latest components and design patterns from the community.",
  },
  {
    question: "Is there a limit to component complexity?",
    answer:
      "Magic AI Agent can handle components of varying complexity, from simple buttons to complex interactive forms. However, for best results, we recommend breaking down very complex UIs into smaller, manageable components.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-10 lg:py-24 px-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-200 sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-lg text-neutral-400">
          Everything you need to know about Magic AI Agent
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto mt-16 max-w-3xl divide-y divide-white/10"
      >
        {faqs.map((faq, index) => (
          <div key={index} className="py-6">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-start justify-between text-left"
            >
              <span className="text-lg font-semibold text-neutral-200">
                {faq.question}
              </span>
              <ChevronDown
                className={`h-6 w-6 transform text-neutral-400 transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="mt-4 text-neutral-400">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
