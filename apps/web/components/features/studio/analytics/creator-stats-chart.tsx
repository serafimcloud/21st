"use client"

import {
  AlertCircle,
  Bot,
  Code,
  DollarSign,
  Eye,
  ScrollText,
  SquareTerminal,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import React from "react"
import { Bar, CartesianGrid, ComposedChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatK, formatPrice } from "@/lib/utils"
import { eachMonthOfInterval, format, startOfMonth } from "date-fns"
import { useMemo, useState } from "react"

const chartConfig = {
  total_earnings: {
    label: "Earnings",
    color: "hsl(var(--chart-1))",
  },
  views: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
  code_copies: {
    label: "Code Copies",
    color: "hsl(var(--chart-2))",
  },
  prompt_copies: {
    label: "Prompt Copies",
    color: "hsl(var(--chart-3))",
  },
  cli_downloads: {
    label: "CLI Downloads",
    color: "hsl(var(--chart-4))",
  },
  mcp_usages: {
    label: "MCP Uses",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export type PayoutStats = {
  mcp_earnings: number
  mcp_usages: number
  views: number
  views_earnings: number
  total_earnings: number
  date: string
}

interface PayoutStatsChartProps {
  data: PayoutStats[]
  isLoading?: boolean
  isPartner?: boolean
}

function getMonthYear(dateString: string) {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function BarChartSection({
  data,
  chartConfig,
  dataKeys,
  groupByMonth,
  valueFormatter = (value: any) => value,
  showTotal = true,
}: {
  data: any[]
  chartConfig: ChartConfig
  dataKeys: string[]
  groupByMonth?: boolean
  valueFormatter?: (value: any) => string
  showTotal?: boolean
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[250px] w-full"
    >
      <ComposedChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          interval="preserveStartEnd"
          tickFormatter={(value) => {
            const date = new Date(value)
            if (groupByMonth) {
              return date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })
            }
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[200px]"
              labelFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
              formatter={(value, name, item, index) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: `var(--color-${name})` }}
                  />
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {valueFormatter(value)}
                  </div>
                  {showTotal && index === 1 && (
                    <div className="flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                      Total
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {(() => {
                          const total = dataKeys.reduce(
                            (sum, key) =>
                              sum +
                              (typeof item.payload[key] === "number"
                                ? item.payload[key]
                                : 0),
                            0,
                          )
                          return valueFormatter(total)
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}
            />
          }
        />
        {dataKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            type="natural"
            fill={`var(--color-${key})`}
            stroke={`var(--color-${key})`}
            stackId={"stack"}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </ComposedChart>
    </ChartContainer>
  )
}

export function PayoutStatsChart({
  data,
  isLoading = false,
  isPartner = true,
}: PayoutStatsChartProps) {
  // Generate all months from earliest in data to current month
  const months = useMemo(() => {
    if (!data || data.length === 0) return []

    // Find earliest date
    const minDate = data.reduce((earliest, item) => {
      if (!item.date) return earliest
      const d = new Date(item.date)
      return d < earliest ? d : earliest
    }, new Date())

    // Generate array of months between earliest date and current month
    const startDate = startOfMonth(minDate)
    const endDate = startOfMonth(new Date())

    return eachMonthOfInterval({ start: startDate, end: endDate })
      .map((date) => format(date, "yyyy-MM"))
      .reverse()
  }, [data])

  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [tab, setTab] = useState<string>("earnings")

  // Group data by month for 'All time' view
  const groupedByMonth = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string
        [key: string]: any // Allow dynamic keys
      }
    >()
    data.forEach((item) => {
      const month = getMonthYear(item.date)
      const entry = map.get(month) ?? {
        date: month,
      }
      // Dynamically sum all numeric fields except 'date'
      for (const key in item) {
        if (key !== "date" && typeof (item as any)[key] === "number") {
          entry[key] = (entry[key] || 0) + (item as any)[key]
        }
      }
      map.set(month, entry)
    })
    // Sort by month ascending
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  const filteredData = useMemo(() => {
    if (selectedMonth === "all") return groupedByMonth
    return data.filter((item) => getMonthYear(item.date) === selectedMonth)
  }, [data, selectedMonth, groupedByMonth])

  const earningsSum = filteredData.reduce(
    (acc, curr) => acc + curr.total_earnings,
    0,
  )

  const statKeysForSelect = useMemo(() => {
    return [
      "views",
      "code_copies",
      "prompt_copies",
      "cli_downloads",
      "mcp_usages",
    ] as const
  }, [])

  const [selectedStat, setSelectedStat] = useState<string>(statKeysForSelect[0])

  const selectedStatSum = useMemo(() => {
    if (!filteredData || !selectedStat || filteredData.length === 0) return 0
    return filteredData.reduce((acc, curr) => {
      const value = (curr as { [key: string]: any })[selectedStat]
      return acc + (typeof value === "number" ? value : 0)
    }, 0)
  }, [filteredData, selectedStat])

  const isEmpty = !filteredData || filteredData.length === 0

  // Map stat keys to icons
  const statIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    views: Eye,
    code_copies: Code,
    prompt_copies: ScrollText,
    cli_downloads: SquareTerminal,
    mcp_usages: Bot,
  }

  return (
    <Card>
      <Tabs defaultValue="earnings" value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-row h-fit">
          <TabsTrigger
            value="earnings"
            className="flex-1 p-3 sm:p-6 flex flex-col gap-1 items-start h-fit"
          >
            {isPartner ? (
              <CardDescription className="font-normal text-xs sm:text-sm">
                Earnings
              </CardDescription>
            ) : (
              <CardDescription className="font-normal flex items-center gap-1 text-xs sm:text-sm">
                Projected Income
                {earningsSum > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="p-2 sm:p-3">
                        <p className="text-xs sm:text-sm">
                          This is how much you could earn by joining our
                          partnership program.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardDescription>
            )}
            <CardTitle className="tracking-normal">
              <span className="inline-flex items-center">
                <DollarSign className="w-5 h-5" />
                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
                    <motion.span
                      key="earnings-skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-6 w-24 ml-0.5 bg-muted-foreground/10 rounded-md"
                      style={{ display: "inline-block" }}
                    >
                      <Skeleton className="h-6 w-24 ml-0.5 bg-muted-foreground/10 rounded-md" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="earnings-value"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-0.5 min-w-[6rem] h-6 flex items-center"
                      style={{ display: "inline-flex" }}
                    >
                      {formatPrice(earningsSum).replace("$", "")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </CardTitle>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex-1 p-3 sm:p-6 flex flex-col gap-1 items-start h-fit"
          >
            <CardDescription className="font-normal text-xs sm:text-sm">
              Stats
            </CardDescription>
            <CardTitle className="tracking-normal flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                {statIcons[selectedStat] &&
                  React.createElement(statIcons[selectedStat], {
                    className: "w-5 h-5",
                  })}
                <AnimatePresence mode="wait" initial={false}>
                  {isLoading ? (
                    <motion.span
                      key="stats-sum-skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-6 w-20 bg-muted-foreground/10 rounded-md"
                      style={{ display: "inline-block" }}
                    >
                      <Skeleton className="h-6 w-20 bg-muted-foreground/10 rounded-md" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="stats-sum-value"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="min-w-[5rem] h-6 flex items-center"
                      style={{ display: "inline-flex" }}
                    >
                      {formatK(selectedStatSum)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </CardTitle>
          </TabsTrigger>
        </TabsList>

        <CardContent className="space-y-6 p-6">
          <div className="flex flex-row justify-end gap-4">
            {tab === "stats" && !isLoading && !isEmpty && (
              <Select value={selectedStat} onValueChange={setSelectedStat}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Stat" />
                </SelectTrigger>
                <SelectContent>
                  {statKeysForSelect.map((statKey) => (
                    <SelectItem key={statKey} value={statKey}>
                      {chartConfig[statKey as keyof typeof chartConfig]
                        ?.label || statKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isLoading ? (
              <Skeleton className="w-48 h-9 rounded-md" />
            ) : !isEmpty ? (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  {months.map((month) => {
                    const [year, m] = month.split("-")
                    const date = new Date(Number(year), Number(m) - 1)
                    return (
                      <SelectItem key={month} value={month}>
                        {date.toLocaleString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-48 h-9 opacity-0 pointer-events-none select-none" />
            )}
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-[250px] flex flex-col items-center justify-center gap-6"
              >
                {/* Skeleton Bar Chart Imitation */}
                <div className="flex items-end justify-between w-full h-[250px] gap-3">
                  <Skeleton className="w-1/12 h-1/2 rounded-sm" />
                  <Skeleton className="w-1/12 h-4/5 rounded-sm" />
                  <Skeleton className="w-1/12 h-2/3 rounded-sm" />
                  <Skeleton className="w-1/12 h-1/3 rounded-sm" />
                  <Skeleton className="w-1/12 h-3/4 rounded-sm" />
                  <Skeleton className="w-1/12 h-2/5 rounded-sm" />
                  <Skeleton className="w-1/12 h-3/5 rounded-sm" />
                  <Skeleton className="w-1/12 h-1/4 rounded-sm" />
                  <Skeleton className="w-1/12 h-2/4 rounded-sm" />
                  <Skeleton className="w-1/12 h-3/4 rounded-sm" />
                </div>
              </motion.div>
            ) : isEmpty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-[250px] relative flex items-center justify-center"
              >
                {/* Skeleton Bar Chart Imitation as background */}
                <div className="absolute inset-0 flex items-end justify-between w-full h-full gap-3 opacity-60 pointer-events-none">
                  <Skeleton className="animate-none w-1/12 h-1/2 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-4/5 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-2/3 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-1/3 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-3/4 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-2/5 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-3/5 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-1/4 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-2/4 rounded-sm" />
                  <Skeleton className="animate-none w-1/12 h-3/4 rounded-sm" />
                </div>
                {/* Overlayed message */}
                <span className="relative z-10 text-muted-foreground text-base font-medium bg-background/80 px-4 py-2 rounded-md">
                  No data available
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <TabsContent value="earnings" className="m-0">
                  <BarChartSection
                    data={filteredData}
                    chartConfig={chartConfig}
                    dataKeys={["total_earnings"]}
                    groupByMonth={selectedMonth === "all"}
                    valueFormatter={formatPrice}
                    showTotal={false}
                  />
                </TabsContent>
                <TabsContent value="stats" className="m-0">
                  <BarChartSection
                    data={filteredData}
                    chartConfig={chartConfig}
                    dataKeys={selectedStat ? [selectedStat] : []}
                    groupByMonth={selectedMonth === "all"}
                    valueFormatter={formatK}
                    showTotal={false}
                  />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Tabs>
    </Card>
  )
}
