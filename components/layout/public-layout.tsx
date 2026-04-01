import { Navbar } from "@/components/navbar"
import { Footer } from "./footer"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-1 pt-18">{children}</main>
      <Footer />
    </div>
  )
}
