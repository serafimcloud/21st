import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { Info } from "lucide-react"

export interface PayoutRecord {
  id: number
  period_start: string
  period_end: string
  total_amount: number
  paypal_email: string
  status: string
  transaction_id: string | null
  created_at: string
  processed_at: string | null
}

interface PayoutHistoryTableProps {
  payouts: PayoutRecord[] | undefined
  isLoading: boolean
}

export function PayoutHistoryTable({
  payouts,
  isLoading,
}: PayoutHistoryTableProps) {
  return (
    <div className="w-full overflow-auto">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-9 py-2">Period</TableHead>
              <TableHead className="h-9 py-2">Amount</TableHead>
              <TableHead className="h-9 py-2">Status</TableHead>
              <TableHead className="h-9 py-2">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <PayoutRowSkeleton />
                <PayoutRowSkeleton />
                <PayoutRowSkeleton />
              </>
            ) : payouts && payouts.length > 0 ? (
              payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="py-2">
                    {new Date(payout.period_start).toLocaleDateString()} -{" "}
                    {new Date(payout.period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-2">
                    {formatPrice(payout.total_amount)}
                  </TableCell>
                  <TableCell className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payout.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : payout.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payout.status.charAt(0).toUpperCase() +
                        payout.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Info className="h-4 w-4 mb-2" />
                    <p>No payout history yet</p>
                    <p className="text-xs max-w-md text-center mt-1">
                      Payouts are processed at the end of each billing period
                      for component creators
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function PayoutRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="py-2">
        <Skeleton className="h-5 w-24" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-6 w-20 rounded-full" />
      </TableCell>
      <TableCell className="py-2">
        <Skeleton className="h-5 w-24" />
      </TableCell>
    </TableRow>
  )
}
