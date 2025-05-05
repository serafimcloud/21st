import { Check } from "lucide-react"

interface FeatureCard {
  title: string
  description: string
}

interface FeatureCardsProps {
  title: string
  features: FeatureCard[]
}


export function FeatureCards({ title, features }: FeatureCardsProps) {
  return (
    <div className="w-full border rounded-lg p-4 mt-auto text-start">
      <h4 className="text-sm font-medium mb-4">{title}</h4>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{feature.title}</span>
              <span className="text-xs text-muted-foreground">
                {feature.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
