"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/shared/theme-toggle"

function safeNextPath(raw: string | null) {
  if (!raw) return "/"
  try {
    const path = raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : new URL(raw).pathname + new URL(raw).search
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) {
      return "/"
    }
    return path
  } catch {
    return "/"
  }
}

function LoginForm() {
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      toast.error("Invalid username, employee number, or password")
      return
    }
    // Full navigation so middleware/session cookie are re-read reliably.
    window.location.assign(safeNextPath(search.get("callbackUrl")))
  }

  return (
    <Card className="border-border/50 bg-card/40 w-full max-w-md shadow-none ring-1 ring-foreground/10">
      <CardHeader>
        <div className="bg-foreground text-background mb-3 flex size-10 items-center justify-center rounded-lg">
          <Ticket className="size-5" />
        </div>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Staff sign in with company credentials from ERP (username or employee number + ERP
          password or NIC). Password reset here is only for invited Desk accounts, not synced
          employees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Username or employee number</Label>
            <Input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password or ID number</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="text-muted-foreground mt-4 space-y-2 text-center text-xs leading-relaxed">
          <p>
            Locked out? Use your company ERP password or your NIC. If access still fails, send a
            reset help request to IT.
          </p>
          <p>
            <Link href="/reset-password" className="hover:text-foreground underline-offset-4 hover:underline">
              Request password reset help
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
