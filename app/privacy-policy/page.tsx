import { PublicLayout } from "@/components/layout/public-layout"
import { Shield } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-primary px-4 py-14 text-primary-foreground lg:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <Shield className="mx-auto mb-5 h-10 w-10 text-accent" />
          <h1 className="mb-3 text-3xl font-bold tracking-tight lg:text-4xl">Privacy Policy</h1>
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
              <h2 className="mb-3 text-lg font-semibold text-foreground">1. Introduction</h2>
              <p>
                GradNexus (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is
                committed to protecting your privacy. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you visit our platform, including
                any related services, features, or content we offer.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">2. Information We Collect</h2>
              <p className="mb-3">We may collect personal information that you voluntarily provide when you:</p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Register for an account (name, email address, role)</li>
                <li>Create or update your profile</li>
                <li>Submit thesis listings or trainee program postings</li>
                <li>Contact us through forms or email</li>
                <li>Subscribe to newsletters or updates</li>
              </ul>
              <p className="mt-3">
                We also automatically collect certain technical data such as your IP address,
                browser type, device information, and usage patterns through cookies and similar
                technologies.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Provide, operate, and maintain our platform</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Communicate with you about updates, offers, and support</li>
                <li>Process and manage account registrations</li>
                <li>Analyze usage trends to enhance user experience</li>
                <li>Detect, prevent, and address technical or security issues</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">4. Sharing Your Information</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may
                share your data with trusted service providers who assist us in operating our
                platform (e.g., hosting, analytics), provided they agree to keep your information
                confidential. We may also disclose information if required by law or to protect our
                rights.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal
                information. However, no method of electronic transmission or storage is 100%
                secure. While we strive to use commercially acceptable means to protect your data,
                we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">6. Cookies</h2>
              <p>
                Our platform uses cookies to enhance your browsing experience, analyze site traffic,
                and understand user preferences. You can choose to disable cookies through your
                browser settings, though some features of the platform may not function properly
                without them.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">7. Your Rights</h2>
              <p className="mb-3">Depending on your location, you may have the right to:</p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@graduatecorner.com" className="font-medium text-accent underline underline-offset-2 hover:text-accent/80">
                  privacy@graduatecorner.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new policy on this page and updating the &ldquo;Last
                updated&rdquo; date. We encourage you to review this policy periodically.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">9. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@graduatecorner.com" className="font-medium text-accent underline underline-offset-2 hover:text-accent/80">
                  privacy@graduatecorner.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
