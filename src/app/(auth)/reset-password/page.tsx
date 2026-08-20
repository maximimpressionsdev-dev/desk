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
  const [employeeNumber, setEmployeeNumber] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/api/auth/password-reset?action=request", {
        employeeNumber,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      toast.success("IT team will contact you immediately.")
      setEmployeeNumber("")
      setEmail("")
      setPhone("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request")
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
          <CardTitle className="text-xl">Request password reset help</CardTitle>
          <CardDescription>
            Enter your employee number. IT team will contact you immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="employeeNumber">Employee Number</Label>
              <Input
                id="employeeNumber"
                type="text"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Sending request..." : "Send request to IT"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
