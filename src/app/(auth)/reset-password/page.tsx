"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export default function ResetRequestPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/api/auth/password-reset?action=request", { email })
      toast.success("If that email exists, a reset link was sent")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="border-border/50 bg-card/40 w-full max-w-md ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle className="text-xl">Reset password</CardTitle>
          <CardDescription>
            Enter your company email, username, or employee number. We&apos;ll send a reset link if
            we have a deliverable address on file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email, username, or employee number</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" disabled={loading} type="submit">
              Send reset link
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
