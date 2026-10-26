import { NewTicketAlerts } from "@/features/inbox/new-ticket-alerts"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NewTicketAlerts />
    </>
  )
}
