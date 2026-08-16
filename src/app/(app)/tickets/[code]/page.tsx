import { redirect } from "next/navigation"

type Params = { params: Promise<{ code: string }> }

export default async function TicketRedirect({ params }: Params) {
  const { code } = await params
  redirect(`/?t=${encodeURIComponent(code)}`)
}
