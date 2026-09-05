import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import ts from "typescript"

function compile(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, URL, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import ${name}`)
    return imports[name]
  } })
  return exports
}
const { ownedAvatarPath } = compile("../lib/avatar-storage.ts")
const base = "https://project.supabase.co"
const prefix = `${base}/storage/v1/object/public/avatars/`
assert.equal(ownedAvatarPath(`${prefix}user-a/photo.png`, base, "user-a"), "user-a/photo.png")
for (const url of [
  `${prefix}user-b/photo.png`, `${prefix}user-a/nested/photo.png`,
  `${prefix}user-a/%2e%2e%2fother.png`, `${prefix}user-a/a%5Cb.png`,
  "https://other.supabase.co/storage/v1/object/public/avatars/user-a/photo.png",
  "https://lh3.googleusercontent.com/photo", "invalid", undefined,
]) assert.equal(ownedAvatarPath(url, base, "user-a"), null)

async function activity({ origin = "https://example.test", user = { id: "user-a" }, category = "wishlist", fail = false, available = true } = {}) {
  const deletions = []
  const handler = compile("../app/api/privacy/activity/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options.status || 200, headers: options.headers }) } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) },
    "@/lib/admin-server": { createAdminClient: () => available ? { from: table => ({ delete: () => ({ eq: async (column, id) => {
      deletions.push({ table, column, id })
      return { error: fail ? { message: "private error" } : null }
    } }) }) } : null },
  })
  const response = await handler.DELETE({ headers: new Headers({ origin }), nextUrl: new URL("https://example.test/api/privacy/activity?user_id=user-b"), json: async () => ({ category, user_id: "user-b" }) })
  assert.match(response.headers["Cache-Control"], /no-store/)
  return { response, deletions }
}
for (const category of ["wishlist", "applications"]) {
  const result = await activity({ category })
  assert.equal(result.response.status, 200)
  assert.deepEqual(result.deletions, [{ table: category, column: "user_id", id: "user-a" }])
}
for (const [options, status] of [[{ user: null }, 401], [{ origin: "https://evil.test" }, 403], [{ category: "profiles" }, 400], [{ available: false }, 503]]) {
  const result = await activity(options)
  assert.equal(result.response.status, status)
  assert.equal(result.deletions.length, 0)
}
const failure = await activity({ fail: true })
assert.equal(failure.response.status, 500)
assert.ok(!JSON.stringify(failure.response).includes("private error"))
console.log("Privacy management checks passed: owned avatar paths, authentication, CSRF, category allowlist, subject isolation, and safe errors.")
