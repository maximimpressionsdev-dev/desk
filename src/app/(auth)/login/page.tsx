"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "@/lib/notice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  // Password sign-in, or a one-time code by SMS (step "send" asks for the EPF number, "code" for the code)
  const [mode, setMode] = useState<"password" | "send" | "code">("password")
  const [code, setCode] = useState("")
  const [sentTo, setSentTo] = useState("")

  async function finish(provider: "credentials" | "sms-code", secret: string, failure: string) {
    setLoading(true)
    const res = await signIn(provider, { email, password: secret, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error(failure)
      return
    }
    // Full navigation so middleware/session cookie are re-read reliably.
    window.location.assign(safeNextPath(search.get("callbackUrl")))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "password") {
      return finish("credentials", password, "That sign-in didn't match. Check your details and try again.")
    }
    if (mode === "code") {
      return finish("sms-code", code, "That code is wrong or has expired. Try again or send a new one.")
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Couldn't send the code, please try again.")
      setSentTo(body.sentTo)
      setCode("")
      setMode("code")
      toast.success(`We sent a code to ${body.sentTo}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the code, please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm sm:max-w-xs">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span aria-hidden className="bg-foreground grid size-11 grid-cols-2 gap-1 rounded-xl p-2.5 shadow-md">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i === 1 ? "bg-background rounded-[3px] opacity-45" : "bg-background rounded-[3px]"} />
          ))}
        </span>
        <div className="space-y-1">
          <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">Sign in to Support Desk</h1>
          <p className="text-muted-foreground text-sm">
            {mode === "password" ? "Use your EPF number, username or ERP email" : "We'll text a code to your mobile"}
          </p>
        </div>
      </div>
      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{mode === "password" ? "EPF number, username or ERP email" : "EPF number or username"}</Label>
          <Input
            id="email"
            type="text"
            className="h-10"
            autoComplete="username"
            value={email}
            disabled={mode === "code"}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {mode === "password" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password, ID number or ERP password</Label>
            <Input
              id="password"
              type="password"
              className="h-10"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        ) : null}
        {mode === "code" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Code sent to {sentTo}</Label>
            <Input
              id="code"
              className="h-10 text-center font-mono text-lg tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
          </div>
        ) : null}
        <Button className="h-10 w-full rounded-xl" disabled={loading} type="submit">
          {loading ? "Please wait…" : mode === "send" ? "Text me a code" : "Sign in"}
        </Button>
        {mode === "password" ? (
          <button type="button" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline" onClick={() => setMode("send")}>
            No password? Sign in with a code by SMS
          </button>
        ) : (
          <div className="text-muted-foreground flex justify-center gap-3 text-sm">
            {mode === "code" ? (
              <button type="button" className="hover:text-foreground underline-offset-4 hover:underline" onClick={() => setMode("send")}>
                Send a new code
              </button>
            ) : null}
            <button type="button" className="hover:text-foreground underline-offset-4 hover:underline" onClick={() => setMode("password")}>
              Use a password instead
            </button>
          </div>
        )}
      </form>
      <p className="text-muted-foreground mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs">
        <Link href="/reset-password" className="hover:text-foreground underline-offset-4 hover:underline">
          Request password reset help
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="/manual" className="font-medium text-violet-600 underline-offset-4 hover:text-violet-700 hover:underline">
          User manual
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col px-4 py-6 font-sans sm:p-10">
      <div className="flex flex-1 items-center justify-center py-10">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="text-muted-foreground text-center text-xs">
        © {new Date().getFullYear()} Maxim Impressions. All rights reserved.
      </p>
    </div>
  )
}
