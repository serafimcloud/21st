import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

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

function InvoiceRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="py-2">
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell className="py-2 text-right">
        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
      </TableCell>
    </TableRow>
  )
}

export function InvoicesList({ invoices, isLoading }: InvoicesListProps) {
  if (isLoading) {
    return (
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-9 py-2">№</TableHead>
                <TableHead className="h-9 py-2">Date</TableHead>
                <TableHead className="h-9 py-2">Amount</TableHead>
                <TableHead className="h-9 py-2">Period</TableHead>
                <TableHead className="h-9 py-2">Status</TableHead>
                <TableHead className="h-9 py-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <InvoiceRowSkeleton />
              <InvoiceRowSkeleton />
              <InvoiceRowSkeleton />
            </TableBody>
          </Table>
        </div>
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
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-9 py-2">№</TableHead>
              <TableHead className="h-9 py-2">Date</TableHead>
              <TableHead className="h-9 py-2">Amount</TableHead>
              <TableHead className="h-9 py-2">Period</TableHead>
              <TableHead className="h-9 py-2">Status</TableHead>
              <TableHead className="h-9 py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="py-2">{invoice.number}</TableCell>
                <TableCell className="py-2">
                  {formatDate(invoice.created)}
                </TableCell>
                <TableCell className="py-2">
                  {formatCurrency(invoice.amount_paid, invoice.currency)}
                </TableCell>
                <TableCell className="py-2">
                  {formatDate(invoice.period_start)} -{" "}
                  {formatDate(invoice.period_end)}
                </TableCell>
                <TableCell className="py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getInvoiceStatusColor(
                      invoice.status,
                    )}`}
                  >
                    {getInvoiceStatusText(invoice.status)}
                  </span>
                </TableCell>
                <TableCell className="py-2 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
