export function PayoutsHeader() {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-sm font-medium">Payouts</h2>
        <p className="text-xs text-muted-foreground mt-1">
          For questions about payouts,{" "}
          <a
            href="mailto:support@21st.dev"
            className="underline hover:text-primary"
          >
            contact us
          </a>
        </p>
      </div>
    </div>
  )
}
