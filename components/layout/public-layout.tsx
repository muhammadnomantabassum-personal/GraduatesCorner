import { Navbar } from "@/components/navbar"
import { Footer } from "./footer"
import { LazyOpportunityAssistant } from "@/components/shared/lazy-opportunity-assistant"
import { SiteProgress } from "@/components/shared/site-progress"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteProgress />
      <Navbar />
      <main className="flex-1 pt-18">{children}</main>
      <Footer />
      <LazyOpportunityAssistant surface="public" />
    </div>
  )
}
