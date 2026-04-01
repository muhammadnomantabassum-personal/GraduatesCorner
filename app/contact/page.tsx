"use client"

import { useState } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Clock, Send } from "lucide-react"
import { toast } from "sonner"

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@graduatecorner.com",
    href: "mailto:hello@graduatecorner.com",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Stockholm, Sweden",
    href: undefined,
  },
  {
    icon: Clock,
    label: "Response Time",
    value: "Within 24 hours",
    href: undefined,
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.")
      return
    }
    setSending(true)
    // Simulate sending
    setTimeout(() => {
      setSending(false)
      toast.success("Message sent! We'll get back to you soon.")
      setForm({ name: "", email: "", subject: "", message: "" })
    }, 1200)
  }

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-primary px-4 py-14 text-primary-foreground lg:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <Mail className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h1 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">Get in Touch</h1>
          <p className="mx-auto max-w-lg text-[15px] text-primary-foreground/60">
            Have a question, feedback, or partnership inquiry? We&apos;d love to hear from you.
            Fill out the form below and we&apos;ll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-14 lg:py-18">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="mb-1 text-lg font-semibold text-foreground">Contact Information</h2>
              <p className="mb-8 text-sm text-muted-foreground">
                Reach out through any of the channels below or use the form.
              </p>

              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <item.icon className="h-[18px] w-[18px] text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-[14px] font-medium text-foreground transition-colors hover:text-accent"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-[14px] font-medium text-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional note */}
              <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-5">
                <p className="text-[13px] leading-[1.65] text-muted-foreground">
                  <span className="font-medium text-foreground">Partnership inquiries?</span>{" "}
                  If you&apos;re a university or company interested in listing opportunities on
                  GradNexus, please include your organization name and website in your message.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-[13px] font-medium text-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={update("name")}
                      className="h-10 rounded-lg border-border bg-background px-3.5 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[13px] font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={update("email")}
                      className="h-10 rounded-lg border-border bg-background px-3.5 text-[13px]"
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-1.5">
                  <label htmlFor="subject" className="text-[13px] font-medium text-foreground">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="What is this about?"
                    value={form.subject}
                    onChange={update("subject")}
                    className="h-10 rounded-lg border-border bg-background px-3.5 text-[13px]"
                  />
                </div>

                <div className="mt-5 space-y-1.5">
                  <label htmlFor="message" className="text-[13px] font-medium text-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={update("message")}
                    className="resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-[13px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.99] disabled:opacity-60"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Sending…
                    </span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
