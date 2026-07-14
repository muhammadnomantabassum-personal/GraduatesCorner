import Link from "next/link"

const content = {
  phd: {
    eyebrow: "Doctoral career guide",
    title: "Find funded PhD positions and doctoral opportunities worldwide",
    introduction:
      "Browse current PhD positions from universities and research institutes, then narrow the results by research field, country, funding, deadline, work mode, and verified organization status.",
    sections: [
      {
        title: "Search by research field and location",
        copy: "Use specific terms such as artificial intelligence, engineering, biology, medicine, sustainability, or social sciences. Compare the research topic, university, country, employment conditions, and closing date before applying.",
      },
      {
        title: "Check funding and eligibility",
        copy: "A strong doctoral listing should explain the project, expected qualifications, funding or salary status, application deadline, and official application route. Always confirm the final requirements on the university website.",
      },
      {
        title: "Prepare a focused PhD application",
        copy: "Tailor your academic CV, motivation letter, research interests, and supporting documents to the advertised project. Apply through the official institution link shown on each opportunity page.",
      },
    ],
    links: [
      { href: "/master-thesis", label: "Explore master's thesis positions" },
      { href: "/blog", label: "Read PhD application guides" },
    ],
  },
  thesis: {
    eyebrow: "Thesis opportunity guide",
    title: "Find master's thesis positions at universities and companies",
    introduction:
      "Discover master's thesis opportunities for students who want to complete an academic research project with a university, research group, startup, or established company.",
    sections: [
      {
        title: "Match the topic to your degree",
        copy: "Search by subject, technology, industry, organization, and location. Review the project scope and make sure the expected methods, prerequisites, and academic level match your programme.",
      },
      {
        title: "Compare academic and industry projects",
        copy: "University projects can provide a research-intensive path, while company thesis positions often connect academic work with practical datasets, products, and industry supervision.",
      },
      {
        title: "Apply before the thesis deadline",
        copy: "Prepare a concise CV, transcript, short motivation, and relevant project examples. Use the official application destination on the listing and confirm supervision and university approval requirements.",
      },
    ],
    links: [
      { href: "/phd-positions", label: "Browse PhD positions" },
      { href: "/trainee-programs", label: "Browse graduate trainee programs" },
    ],
  },
  trainee: {
    eyebrow: "Graduate career guide",
    title: "Discover graduate trainee programs and early-career opportunities",
    introduction:
      "Compare structured graduate trainee programs from companies offering rotations, professional development, mentorship, and practical experience for students and recent graduates.",
    sections: [
      {
        title: "Choose the right graduate programme",
        copy: "Filter by field, country, company, compensation, duration, deadline, and work mode. Look for a programme structure that supports your target profession and long-term development.",
      },
      {
        title: "Understand the selection process",
        copy: "Graduate recruitment can include an application form, CV screening, aptitude tests, interviews, assessment centres, and case exercises. Review the employer's official instructions carefully.",
      },
      {
        title: "Build an evidence-based application",
        copy: "Show measurable university, internship, project, leadership, and teamwork experience. Tailor your CV and cover letter to the skills and business area named in the trainee programme.",
      },
    ],
    links: [
      { href: "/master-thesis", label: "Find master's thesis opportunities" },
      { href: "/blog", label: "Read graduate career advice" },
    ],
  },
} as const

export function OpportunitySeoContent({ type }: { type: keyof typeof content }) {
  const page = content[type]

  return (
    <section className="border-y border-border/70 bg-card/55 px-4 py-14" aria-labelledby={`${type}-search-guide`}>
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold text-primary">{page.eyebrow}</p>
        <h2 id={`${type}-search-guide`} className="mt-2 max-w-4xl text-balance text-2xl font-bold text-foreground sm:text-3xl">
          {page.title}
        </h2>
        <p className="mt-4 max-w-4xl leading-relaxed text-muted-foreground">{page.introduction}</p>

        <div className="mt-9 grid gap-7 border-t border-border/70 pt-8 md:grid-cols-3">
          {page.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.copy}</p>
            </div>
          ))}
        </div>

        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/70 pt-6" aria-label="Related opportunity resources">
          {page.links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-primary hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
