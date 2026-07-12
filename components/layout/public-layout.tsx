import { Navbar } from "@/components/navbar"
import { Footer } from "./footer"
import { LazyOpportunityAssistant } from "@/components/shared/lazy-opportunity-assistant"
import { SiteProgress } from "@/components/shared/site-progress"
import { PageTransition } from "@/components/shared/page-transition"
import { ComparisonTray } from "@/components/shared/comparison-tray"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteProgress />
      <Navbar />
      <main id="main-content" className="flex-1 pt-20" tabIndex={-1}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <ComparisonTray />
      <LazyOpportunityAssistant surface="public" />
    </div>
  )
}
