// Only remove files owned by the signed-in user in this project's avatar bucket.
// Never turn an arbitrary profile URL into a storage deletion target.
export function ownedAvatarPath(value: string | undefined, supabaseUrl: string | undefined, userId: string) {
  if (!value || !supabaseUrl) return null
  try {
    const url = new URL(value)
    const project = new URL(supabaseUrl)
    const prefix = "/storage/v1/object/public/avatars/"
    if (url.origin !== project.origin || !url.pathname.startsWith(prefix)) return null
    const path = decodeURIComponent(url.pathname.slice(prefix.length))
    const parts = path.split("/")
    if (parts.length !== 2 || parts[0] !== userId || !parts[1] || parts[1] === "." || parts[1] === ".." || path.includes("\\")) return null
    return path
  } catch {
    return null
  }
}
