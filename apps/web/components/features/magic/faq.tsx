"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { PLAN_LIMITS } from "@/lib/config/subscription-plans"
import { cn } from "@/lib/utils"

export interface FAQ {
  question: string
  answer: React.ReactNode
}

interface FAQProps {
  simplified?: boolean
  faqs?: FAQ[]
}

const DEFAULT_FAQS = [
  {
    question: "How does Magic AI Agent work?",
    answer:
      "Magic AI Agent searches for relevant components in the 21st.dev library based on your request. Using RAG technology, it finds the top 3 matching components and draws inspiration from them to create new, unique components tailored to your needs. The IDE agent understands your application context and seamlessly integrates the new components in the right place.",
  },
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
    question: "Who owns the generated components?",
    answer:
      "You fully own all components generated for you by Magic AI Agent. There are no licensing restrictions - you're free to use, modify, and distribute the components however you want in your projects.",
  },
  {
    question: "How does revenue sharing work with component authors?",
    answer:
      "For each generation, 50% covers AI costs while the remaining 50% is split between 21st.dev and the authors of components that inspired the generation. For example, with a $10/50 generations subscription ($0.20 per generation), half goes to AI costs and half is split between 21st.dev and component authors. Authors receive their share via PayPal monthly (after a 21-day holding period).",
  },
  {
    question: "What happens if I run out of generations?",
    answer: `If you exceed your monthly generation limit, you'll be prompted to upgrade your plan. The Hobby plan includes ${PLAN_LIMITS.free.generationsPerMonth} generations per month, Standard plan includes ${PLAN_LIMITS.pro.generationsPerMonth} generations, and Pro plan includes ${PLAN_LIMITS.pro.generationsPerMonth} generations. You can upgrade at any time to continue generating components.`,
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
  {
    question: "How can I get help with Magic AI Agent?",
    answer: (
      <>
        If you need assistance, you can contact us via email at support@21st.dev
        or join our{" "}
        <Link
          href="https://discord.gg/Qx4rFunHfm"
          target="_blank"
          className="underline underline-offset-4"
        >
          Discord community
        </Link>
        . We're here to help you get the most out of Magic AI Agent.
      </>
    ),
  },
]

export function FAQ({ simplified = false, faqs = DEFAULT_FAQS }: FAQProps) {
  const displayFaqs = simplified ? faqs.slice(0, 5) : faqs

  return (
    <section className={simplified ? "" : "py-10 lg:py-24"}>
      {!simplified && (
        <div className="text-center">
          <h2 className="text-5xl sm:text-[3.9rem]/16 pb-2 font-bold tracking-tighter text-pretty bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white sm:text-balance">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Everything you need to know about Magic AI Agent
          </p>
        </div>
      )}

      <div
        className={cn("mx-auto space-y-4", simplified ? "" : "mt-16 max-w-3xl")}
      >
        <Accordion type="single" collapsible className="w-full">
          {displayFaqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-lg border border-white/10 px-4 bg-background/5 mb-4 data-[state=open]:bg-background/10"
            >
              <AccordionTrigger className="text-lg font-semibold text-neutral-200 hover:no-underline py-4 text-left w-full flex justify-between">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-neutral-400 pb-4 !text-left">
                <div className="text-left">{faq.answer}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <style jsx global>{`
        .accordion-content {
          text-align: left !important;
        }
        [data-radix-accordion-content] {
          text-align: left !important;
        }
        [data-radix-accordion-content] p {
          text-align: left !important;
        }
      `}</style>
    </section>
  )
}
