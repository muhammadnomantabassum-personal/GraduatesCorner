import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { createRequire } from "node:module"
import ts from "typescript"

export function typescriptLoader(overrides = {}) {
  const cache = new Map()
  function load(filename) {
    filename = path.resolve(filename)
    if (cache.has(filename)) return cache.get(filename)
    const exports = {}
    cache.set(filename, exports)
    const nativeRequire = createRequire(filename)
    const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    vm.runInNewContext(code, {
      exports, URL, URLSearchParams, TextDecoder, Uint8Array, AbortSignal, Response, Error, Date, console, process, setTimeout, clearTimeout, fetch: overrides.fetch || fetch,
      require(name) {
        if (name === "server-only") return {}
        if (name in overrides) return overrides[name]
        if (name.startsWith(".")) {
          let target = path.resolve(path.dirname(filename), name)
          if (!existsSync(target)) target += ".ts"
          return load(target)
        }
        return nativeRequire(name)
      },
    }, { filename })
    return exports
  }
  return load
}
