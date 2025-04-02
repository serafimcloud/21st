"use client"

import { User } from "@/types/global"
import { Component } from "@/types/component"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  CreditCard,
  Download,
  Users,
  ChevronsUpDown,
  DollarSign,
  Wallet,
  Landmark,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StudioMonetizationProps {
  user: User
  components: Component[]
}

export function StudioMonetization({
  user,
  components = [],
}: StudioMonetizationProps) {
  // Mock data for now
  const earningsData = [
    { month: "Jan", earnings: 0 },
    { month: "Feb", earnings: 0 },
    { month: "Mar", earnings: 0 },
    { month: "Apr", earnings: 50 },
    { month: "May", earnings: 120 },
    { month: "Jun", earnings: 210 },
    { month: "Jul", earnings: 280 },
  ]

  const transactionsData = [
    {
      id: 1,
      date: "2023-07-01",
      amount: 120.5,
      status: "completed",
      description: "Premium component sales",
    },
    {
      id: 2,
      date: "2023-06-15",
      amount: 85.25,
      status: "completed",
      description: "Component royalties",
    },
    {
      id: 3,
      date: "2023-06-01",
      amount: 75.0,
      status: "completed",
      description: "Premium component sales",
    },
    {
      id: 4,
      date: "2023-05-15",
      amount: 50.0,
      status: "completed",
      description: "Component royalties",
    },
  ]

  const pricingTiers = [
    {
      name: "Basic",
      description: "For new component authors",
      features: [
        "Publish up to 10 components",
        "Basic analytics",
        "80% revenue share",
        "Community support",
      ],
      current: true,
    },
    {
      name: "Pro",
      description: "For established authors",
      price: "$19/month",
      features: [
        "Unlimited components",
        "Advanced analytics",
        "85% revenue share",
        "Priority support",
        "Featured placement",
      ],
      current: false,
    },
    {
      name: "Enterprise",
      description: "For teams and businesses",
      price: "Contact us",
      features: [
        "Custom component branding",
        "Team management",
        "90% revenue share",
        "Dedicated support",
        "Custom integration options",
      ],
      current: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monetization</h2>
          <p className="text-muted-foreground">
            Manage your earnings and payment methods
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$486.00</div>
                <p className="text-xs text-muted-foreground">
                  +$124.00 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$280.00</div>
                <p className="text-xs text-muted-foreground">
                  Available for withdrawal
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Components Sold
                </CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">124</div>
                <p className="text-xs text-muted-foreground">
                  +18 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenue Share
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">80%</div>
                <p className="text-xs text-muted-foreground">
                  Basic author plan
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>
                  Your earnings over the past 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${value}`, "Earnings"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="earnings"
                        stroke="#10b981"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                        name="Earnings ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Monthly Goal</CardTitle>
                <CardDescription>$500 target for this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">$280 of $500</span>
                    <span className="text-sm text-muted-foreground">56%</span>
                  </div>
                  <Progress value={56} />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Top Earning Components
                  </h4>
                  <ul className="space-y-2">
                    {components.length > 0
                      ? components.slice(0, 3).map((component, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{component.name}</span>
                            <span className="font-medium">
                              ${Math.floor(Math.random() * 100)}
                            </span>
                          </li>
                        ))
                      : [
                          { name: "Modal Dialog", amount: "$120" },
                          { name: "DataTable", amount: "$85" },
                          { name: "Card Component", amount: "$75" },
                        ].map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium">{item.amount}</span>
                          </li>
                        ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your most recent earnings and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {transaction.status === "completed" ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              <span className="text-xs">Completed</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                              <span className="text-xs">Pending</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline">View All Transactions</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
              <CardDescription>
                Detailed breakdown of your revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed earnings information will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div className="flex items-center space-x-3">
                  <Landmark className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Bank Account (Primary)</p>
                    <p className="text-sm text-muted-foreground">••••1234</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-md">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-muted-foreground">
                      example@example.com
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>

              <Button className="w-full">Add Payment Method</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Information</CardTitle>
              <CardDescription>
                Manage your tax documents and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-md">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    <p className="font-medium">W-9 Form</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on Jan 15, 2023
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID (EIN/SSN)</Label>
                <Input id="tax-id" type="text" value="••••••1234" disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={tier.current ? "border-primary" : ""}
              >
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tier.price && (
                    <div className="text-3xl font-bold">{tier.price}</div>
                  )}
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.current ? "outline" : "default"}
                    disabled={tier.current}
                  >
                    {tier.current ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
