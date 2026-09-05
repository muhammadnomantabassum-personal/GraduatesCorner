import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import ts from "typescript"

const source = readFileSync(new URL("../app/api/privacy/export/route.ts", import.meta.url), "utf8")
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

async function run({ signedIn = true, available = true, failTable = "" } = {}) {
  const calls = []
  const db = { from(table) {
    return { select() { return this }, eq(column, id) {
      calls.push({ table, column, id })
      assert.equal(id, "user-a", "Every query must use the verified user")
      return this
    }, order() { return this }, async range(start, end) {
      if (table === failTable) return { data: null, error: { message: "sensitive internal error" } }
      const count = table === "wishlist" ? 1105 : 1
      return { data: Array.from({ length: Math.max(0, Math.min(end + 1, count) - start) }, (_, i) => ({ id: start + i })), error: null }
    } }
  } }
  const exports = {}
  vm.runInNewContext(code, { exports, require(name) {
    if (name === "next/server") return { NextResponse: { json: (body, options) => ({ body, ...options, status: options.status || 200 }) } }
    if (name === "@/lib/supabase/server") return { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "user-a", email: "a@example.test", user_metadata: { provider_token: "never-export" } } : null }, error: null }) } }) }
    if (name === "@/lib/admin-server") return { createAdminClient: () => available ? db : null }
    throw new Error(`Unexpected import: ${name}`)
  } })
  // Client-controlled data is deliberately ignored by the handler.
  const response = await exports.GET(new Request("https://example.test/api/privacy/export?user_id=user-b"))
  assert.match(response.headers["Cache-Control"], /no-store/)
  assert.ok(!JSON.stringify(response).includes("never-export"))
  return { response, calls }
}

const denied = await run({ signedIn: false })
assert.equal(denied.response.status, 401)
assert.equal(denied.calls.length, 0)
assert.equal((await run({ available: false })).response.status, 503)
const success = await run()
assert.equal(success.response.status, 200)
assert.equal(success.response.body.records.wishlist.length, 1105)
assert.equal(Object.keys(success.response.body.records).length, 8)
const failed = await run({ failTable: "applications" })
assert.equal(failed.response.status, 500)
assert.equal(failed.response.body.records, undefined)
assert.ok(!JSON.stringify(failed.response).includes("sensitive internal error"))
console.log("Privacy export checks passed: authentication, subject isolation, pagination, no-store, secret exclusion, and failure handling.")
