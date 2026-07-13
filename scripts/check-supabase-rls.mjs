import { readFileSync } from "node:fs"

function parseEnv(path) {
  const values = {}

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue

    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      try {
        value = JSON.parse(value)
      } catch {
        value = value.slice(1, -1)
      }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }

    values[match[1]] = value
  }

  return values
}

const envPath = process.argv[2] || ".env.local"
const env = parseEnv(envPath)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error("RLS check requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  process.exit(1)
}

function publicKeyKind(value) {
  if (value.startsWith("sb_publishable_")) return "publishable"

  const parts = value.split(".")
  if (parts.length !== 3) return "unknown"

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))
    return payload?.role === "anon" ? "anon" : "non-anon"
  } catch {
    return "unknown"
  }
}

const keyKind = publicKeyKind(anonKey)
if (keyKind !== "publishable" && keyKind !== "anon") {
  console.error(`RLS check refused a ${keyKind} credential in NEXT_PUBLIC_SUPABASE_ANON_KEY.`)
  process.exit(1)
}

async function query(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  return { status: response.status, body }
}

const checks = []

function record(name, passed, diagnostic = "") {
  checks.push({ name, passed, diagnostic })
}

try {
  const sensitiveProfileColumn = await query("profiles?select=email&limit=1")
  record("profile email is denied to anon", sensitiveProfileColumn.status >= 400)

  const publicProfileColumns = await query("profiles?select=id,name,type,is_verified&limit=1")
  record("public profile projection is available", publicProfileColumns.status === 200)

  const adminUsers = await query("admin_users?select=id&limit=1")
  record(
    "admin credentials are not readable",
    adminUsers.status >= 400 || (Array.isArray(adminUsers.body) && adminUsers.body.length === 0),
    `HTTP ${adminUsers.status}; rows=${Array.isArray(adminUsers.body) ? adminUsers.body.length : "n/a"}`
  )

  for (const table of ["wishlist", "applications"]) {
    const result = await query(`${table}?select=*&limit=1`)
    record(
      `${table} is private to authenticated owners`,
      result.status === 200 && Array.isArray(result.body) && result.body.length === 0
    )
  }

  for (const table of ["theses", "trainee_programs", "blog_posts", "blog_comments", "testimonials"]) {
    const result = await query(`${table}?select=status&limit=100`)
    record(
      `${table} exposes approved rows only`,
      result.status === 404 ||
        (result.status === 200 &&
          Array.isArray(result.body) &&
          result.body.every((row) => row?.status === "approved")),
      `HTTP ${result.status}; rows=${Array.isArray(result.body) ? result.body.length : "n/a"}; statuses=${
        Array.isArray(result.body)
          ? [...new Set(result.body.map((row) => String(row?.status)))].join(",") || "none"
          : "n/a"
      }`
    )
  }
} catch {
  console.error("Supabase RLS check failed because the service was unreachable.")
  process.exit(1)
}

for (const check of checks) {
  console.log(
    `${check.passed ? "PASS" : "FAIL"} ${check.name}${
      !check.passed && check.diagnostic ? ` (${check.diagnostic})` : ""
    }`
  )
}

if (checks.some((check) => !check.passed)) {
  process.exit(1)
}
