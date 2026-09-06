export function opportunityId(value: string) {
  return value.match(/(?:^|--)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)?.[1]?.toLowerCase() || null
}

export function opportunityPath(kind: "phd" | "master" | "trainee", id: string, title: string, organization = "") {
  const slug = `${title} ${organization}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110).replace(/-$/, "") || "opportunity"
  return `/${kind === "phd" ? "phd-positions" : kind === "trainee" ? "trainee-programs" : "theses"}/${slug}--${id}`
}
