import { PublicLayout } from "@/components/layout/public-layout"
import { FileText } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-primary px-4 py-14 text-primary-foreground lg:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <FileText className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h1 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">Terms of Service</h1>
          <p className="text-[15px] text-primary-foreground/60">
            Last updated: March 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-14 lg:py-18">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-10 text-[15px] leading-[1.8] text-muted-foreground">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing or using GraduatesCorner (&ldquo;the Platform&rdquo;), you agree to be
                bound by these Terms of Service. If you do not agree to all of these terms, you may
                not access or use the Platform. We reserve the right to update these terms at any
                time, and continued use constitutes acceptance of the revised terms.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">2. Description of Service</h2>
              <p>
                GraduatesCorner is a platform that connects students, universities, and companies
                for thesis collaborations and trainee programs. We facilitate discovery and
                communication but do not employ, contract, or guarantee placements for any party.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">3. Account Registration</h2>
              <p className="mb-3">When creating an account, you agree to:</p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that violate these terms or
                provide false information.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">4. User Conduct</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Post false, misleading, or fraudulent content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the Platform for unauthorized advertising or spam</li>
                <li>Attempt to gain unauthorized access to the Platform</li>
                <li>Interfere with or disrupt the Platform&apos;s functionality</li>
                <li>Violate any applicable local, national, or international laws</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">5. Content Ownership</h2>
              <p>
                You retain ownership of any content you submit to the Platform (e.g., thesis
                descriptions, program listings, reviews). By posting content, you grant Graduate
                Corner a non-exclusive, worldwide, royalty-free license to use, display, and
                distribute such content in connection with operating the Platform. You represent that
                you have the right to grant this license.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">6. Intellectual Property</h2>
              <p>
                The Platform, including its design, logos, text, graphics, and software, is the
                property of GraduatesCorner and is protected by intellectual property laws. You may
                not copy, modify, distribute, or create derivative works from any part of the
                Platform without our prior written consent.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">7. Disclaimer of Warranties</h2>
              <p>
                The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
                warranties of any kind, whether express or implied. We do not guarantee that the
                Platform will be uninterrupted, error-free, or secure. We make no warranties
                regarding the accuracy or completeness of listings or any content posted by users.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, GraduatesCorner shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including loss of
                profits, data, or opportunities, arising from your use of or inability to use the
                Platform.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">9. Termination</h2>
              <p>
                We may terminate or suspend your access to the Platform immediately, without prior
                notice, if you breach these Terms of Service. Upon termination, your right to use
                the Platform ceases immediately. Provisions that by their nature should survive
                termination will remain in effect.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">10. Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the
                laws of Sweden. Any disputes arising under these terms shall be subject to the
                exclusive jurisdiction of the courts in Stockholm, Sweden.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">11. Contact Us</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@graduatecorner.com" className="font-medium text-accent underline underline-offset-2 hover:text-accent/80">
                  legal@graduatecorner.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
