import { PublicLayout } from "@/components/layout/public-layout"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"
import Link from "next/link"

const faqCategories = [
  {
    title: "General",
    items: [
      {
        q: "What is GradNexus?",
        a: "GradNexus is a platform that connects students with thesis positions and trainee programs offered by universities and companies across Scandinavia and beyond. We make it easy to discover, compare, and apply for academic and professional opportunities.",
      },
      {
        q: "Is GradNexus free to use?",
        a: "Yes, GradNexus is completely free for students. Universities and companies can create accounts and list opportunities at no cost during our launch phase. Premium features for organizations may be introduced in the future.",
      },
      {
        q: "Which countries do you cover?",
        a: "We primarily focus on opportunities in Scandinavia (Sweden, Denmark, Norway, Finland) but we are expanding to cover more European countries. Many of our listed programs also accept international applicants.",
      },
    ],
  },
  {
    title: "For Students",
    items: [
      {
        q: "How do I apply for a thesis or trainee program?",
        a: "Browse our listings, find a position that interests you, and follow the application link provided on the listing page. Each listing includes specific instructions from the organization. You do not need an account to browse, but creating one lets you save favorites.",
      },
      {
        q: "Do I need to create an account to use the platform?",
        a: "No, you can browse all theses and trainee programs without an account. However, creating a free student account allows you to save bookmarks, receive alerts for new listings in your field, and leave testimonials.",
      },
      {
        q: "Can I post my own thesis topic for companies to find?",
        a: "Currently, thesis listings are posted by universities and companies. However, we are working on a feature that allows students to pitch thesis ideas. Stay tuned for updates!",
      },
    ],
  },
  {
    title: "For Universities & Companies",
    items: [
      {
        q: "How do I list a thesis or trainee program?",
        a: "Register for a university or company account, then navigate to your dashboard. From there, you can create new listings with detailed descriptions, requirements, and application links. Your listings will be visible to all students on the platform.",
      },
      {
        q: "Can I edit or remove a listing after publishing?",
        a: "Yes, you can edit or remove any of your listings at any time through your dashboard. Updates will be reflected immediately on the platform.",
      },
      {
        q: "How do students reach us?",
        a: "Each listing includes the application link you provide. Students follow that link to apply directly through your preferred channel — whether it's your website, an email, or an application portal.",
      },
    ],
  },
  {
    title: "Account & Support",
    items: [
      {
        q: "I forgot my password. What should I do?",
        a: "Click \"Forgot password?\" on the login page, enter your email address, and we'll send you a reset link. If you don't receive the email within a few minutes, check your spam folder or contact our support team.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion by contacting us at support@graduatecorner.com. We will process your request and remove your personal data in accordance with our Privacy Policy.",
      },
      {
        q: "How can I contact support?",
        a: "You can reach our support team through the Contact page or by emailing support@graduatecorner.com. We typically respond within 24 hours on business days.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-primary px-4 py-14 text-primary-foreground lg:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <HelpCircle className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h1 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto max-w-lg text-[15px] text-primary-foreground/60">
            Everything you need to know about GradNexus. Can&apos;t find what you&apos;re
            looking for?{" "}
            <Link href="/contact" className="font-medium text-accent underline underline-offset-2 hover:text-accent/80">
              Get in touch
            </Link>.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="px-4 py-14 lg:py-18">
        <div className="mx-auto max-w-3xl space-y-12">
          {faqCategories.map((category) => (
            <div key={category.title}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {category.title}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${category.title}-${i}`}
                    className="border-border/60"
                  >
                    <AccordionTrigger className="py-4 text-left text-[15px] font-medium text-foreground hover:no-underline [&[data-state=open]]:text-accent">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-[14px] leading-[1.75] text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          {/* CTA */}
          <div className="rounded-xl border border-border bg-secondary/40 p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Still have questions?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
            </p>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
