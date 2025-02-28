import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface Invoice {
  id: string
  number: string
  created: number
  amount_paid: number
  status: string
  period_start: number
  period_end: number
  invoice_pdf: string | null
  currency: string
}

interface InvoicesListProps {
  invoices: Invoice[]
  isLoading: boolean
}

// Format date
const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString()
}

// Format currency
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

// Get invoice status text
const getInvoiceStatusText = (status: string) => {
  switch (status) {
    case "paid":
      return "Paid"
    case "open":
      return "Pending"
    case "void":
      return "Voided"
    case "draft":
      return "Draft"
    case "uncollectible":
      return "Uncollectible"
    default:
      return status
  }
}

// Get invoice status color
const getInvoiceStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "text-green-700 bg-green-100 border border-green-200 shadow-inner"
    case "open":
      return "text-yellow-700 bg-yellow-100 border border-yellow-200 shadow-inner"
    case "void":
    case "uncollectible":
      return "text-red-700 bg-red-100 border border-red-200 shadow-inner"
    case "draft":
      return "text-gray-700 bg-gray-100 border border-gray-200 shadow-inner"
    default:
      return "text-gray-700 bg-gray-100 border border-gray-200 shadow-inner"
  }
}

function InvoicesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-normal">№</th>
              <th className="px-4 py-2 font-normal">Date</th>
              <th className="px-4 py-2 font-normal">Amount</th>
              <th className="px-4 py-2 font-normal">Period</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(1)].map((_, i) => (
              <tr key={i} className="text-xs">
                <td className="px-4 py-2"><div className="h-4 bg-muted rounded"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-muted rounded"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-muted rounded"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-muted rounded"></div></td>
                <td className="px-4 py-2"><div className="h-4 bg-muted rounded w-20"></div></td>
                <td className="px-4 py-2 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function InvoicesList({ invoices, isLoading }: InvoicesListProps) {
  if (isLoading) {
    return (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <InvoicesSkeleton />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="min-h-24 flex items-center justify-center p-6">
          <p className="text-xs text-muted-foreground">No invoices yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-normal">№</th>
              <th className="px-4 py-2 font-normal">Date</th>
              <th className="px-4 py-2 font-normal">Amount</th>
              <th className="px-4 py-2 font-normal">Period</th>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="text-xs">
                <td className="px-4 py-2">{invoice.number}</td>
                <td className="px-4 py-2">{formatDate(invoice.created)}</td>
                <td className="px-4 py-2">
                  {formatCurrency(invoice.amount_paid, invoice.currency)}
                </td>
                <td className="px-4 py-2">
                  {formatDate(invoice.period_start)} -{" "}
                  {formatDate(invoice.period_end)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full ${getInvoiceStatusColor(
                      invoice.status,
                    )}`}
                  >
                    {getInvoiceStatusText(invoice.status)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {invoice.invoice_pdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(invoice.invoice_pdf as string, "_blank")
                      }
                      className="h-8 w-8 p-0"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download PDF</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
