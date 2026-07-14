import { JsonLd } from "@/components/seo/json-ld"
import { buildBreadcrumbSchema, buildJobPostingSchema } from "@/lib/seo"
import { getSeoThesis } from "@/lib/seo-data"

export default async function PhdPositionDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const position = await getSeoThesis(id, "phd")
  const active = position && position.deadline >= new Date().toISOString().slice(0, 10)

  return (
    <>
      {position ? (
        <JsonLd
          data={[
            ...(active
              ? [
                  buildJobPostingSchema({
                    id: position.id,
                    title: position.title,
                    description: position.description,
                    organization: position.organization,
                    location: position.location,
                    deadline: position.deadline,
                    createdAt: position.created_at,
                    path: `/phd-positions/${position.id}`,
                    field: position.subject,
                    kind: "phd",
                  }),
                ]
              : []),
            buildBreadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "PhD Positions", path: "/phd-positions" },
              { name: position.title, path: `/phd-positions/${position.id}` },
            ]),
          ]}
        />
      ) : null}
      {children}
    </>
  )
}
