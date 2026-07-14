import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { buildBreadcrumbSchema, buildThesisSchema, createPageMetadata } from "@/lib/seo"
import { getSeoThesis } from "@/lib/seo-data"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const thesis = await getSeoThesis(id, "master")

  if (!thesis) {
    return createPageMetadata({
      title: "Master's Thesis Opportunity Not Found",
      description: "This master's thesis opportunity is not currently available.",
      path: `/theses/${id}`,
      noIndex: true,
    })
  }

  return createPageMetadata({
    title: `${thesis.title} - Master's Thesis at ${thesis.organization}`,
    description: `${thesis.description} Subject: ${thesis.subject}. Location: ${thesis.location}. Application deadline: ${thesis.deadline}.`,
    path: `/theses/${id}`,
    keywords: ["master thesis position", thesis.subject, thesis.organization, thesis.location],
  })
}

export default async function ThesisDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const thesis = await getSeoThesis(id, "master")
  const active = thesis && thesis.deadline >= new Date().toISOString().slice(0, 10)

  return (
    <>
      {thesis ? (
        <JsonLd
          data={[
            ...(active
              ? [
                  buildThesisSchema({
                    id: thesis.id,
                    title: thesis.title,
                    description: thesis.description,
                    organization: thesis.organization,
                    location: thesis.location,
                    deadline: thesis.deadline,
                    createdAt: thesis.created_at,
                    field: thesis.subject,
                  }),
                ]
              : []),
            buildBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Master's Thesis Positions", path: "/master-thesis" },
              { name: thesis.title, path: `/theses/${thesis.id}` },
            ]),
          ]}
        />
      ) : null}
      {children}
    </>
  )
}
