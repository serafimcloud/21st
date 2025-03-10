import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

export interface FAQ {
  question: string
  answer: React.ReactNode
}

interface FAQProps {
  simplified?: boolean
  faqs?: FAQ[]
}

export function FAQ({ simplified = false, faqs = [] }: FAQProps) {
  const displayFaqs = simplified ? faqs.slice(0, 5) : faqs

  return (
    <section className={simplified ? "" : "py-10 lg:py-24 px-4 !mt-0"}>
      {!simplified && (
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know
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
              className="rounded-lg border border-border px-4 bg-muted/50 mb-4 data-[state=open]:bg-muted"
            >
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline py-4 text-left w-full flex justify-between">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                <div className="text-left">{faq.answer}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
