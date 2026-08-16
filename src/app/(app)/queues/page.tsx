import { redirect } from "next/navigation"

export default function QueuesRedirect() {
  redirect("/?tab=queue")
}
