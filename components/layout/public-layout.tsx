import { Navbar } from "@/components/navbar"
import { Footer } from "./footer"
import { OpportunityAssistant } from "@/components/shared/opportunity-assistant"
import { SiteProgress } from "@/components/shared/site-progress"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteProgress />
      <Navbar />
      <main className="flex-1 pt-18">{children}</main>
      <Footer />
      <OpportunityAssistant surface="public" />
    </div>
  )
}
