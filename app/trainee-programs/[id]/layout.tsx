import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { buildBreadcrumbSchema, buildJobPostingSchema, createPageMetadata } from "@/lib/seo"
import { getSeoProgram } from "@/lib/seo-data"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const program = await getSeoProgram(id)

  if (!program) {
    return createPageMetadata({
      title: "Graduate Trainee Program Not Found",
      description: "This graduate trainee program is not currently available.",
      path: `/trainee-programs/${id}`,
      noIndex: true,
    })
  }

  return createPageMetadata({
    title: `${program.title} Graduate Program at ${program.company}`,
    description: `${program.description} Field: ${program.field}. Location: ${program.location}. Application deadline: ${program.deadline}.`,
    path: `/trainee-programs/${id}`,
    keywords: ["graduate trainee program", program.field, program.company, program.location],
  })
}

export default async function TraineeProgramDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const program = await getSeoProgram(id)
  const active = program && program.deadline >= new Date().toISOString().slice(0, 10)

  return (
    <>
      {program ? (
        <JsonLd
          data={[
            ...(active
              ? [
                  buildJobPostingSchema({
                    id: program.id,
                    title: program.title,
                    description: program.description,
                    organization: program.company,
                    location: program.location,
                    deadline: program.deadline,
                    createdAt: program.created_at,
                    path: `/trainee-programs/${program.id}`,
                    field: program.field,
                    kind: "trainee",
                  }),
                ]
              : []),
            buildBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Trainee Programs", path: "/trainee-programs" },
              { name: program.title, path: `/trainee-programs/${program.id}` },
            ]),
          ]}
        />
      ) : null}
      {children}
    </>
  )
}
