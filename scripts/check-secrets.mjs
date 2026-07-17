import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

const secretPatterns = [
  ["Supabase secret or publishable key", /sb_(?:secret|publishable)_[A-Za-z0-9_-]{16,}/g],
  ["Supabase access token", /sbp_[A-Za-z0-9]{20,}/g],
  ["JWT", /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g],
  ["GitHub token", /gh[opusr]_[A-Za-z0-9_]{20,}/g],
  ["OpenAI key", /(?<![A-Za-z0-9_])sk-[A-Za-z0-9_-]{20,}/g],
  ["Stripe key", /[rps]k_(?:live|test)_[A-Za-z0-9]{16,}/g],
  ["AWS access key", /(?:AKIA|ASIA)[A-Z0-9]{16}/g],
  ["Database connection string", /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[^\s'"`]+/gi],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
]

const sensitivePublicName = /NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|USERNAME|ACCESS_TOKEN|REFRESH_TOKEN|DATABASE_URL|OPENAI|SENDGRID|TWILIO|AWS_)/g
const sensitiveServerReference = /process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|ADMIN_SESSION_SECRET|ADMIN_USERNAME|ADMIN_PASSWORD_HASH|CRON_SECRET)/g
const credentialAssignment = /\b(?:password|passwd|apiKey|api_key|accessToken|access_token|authToken|auth_token|clientSecret|client_secret|serviceRoleKey|service_role_key|jwtSecret|jwt_secret)\b\s*[:=]\s*["'`]([^"'`\r\n]+)["'`]/gi
const ignoredPaths = new Set(["yarn.lock"])

function walkSourceFiles(directory = ".") {
  const ignoredDirectories = new Set([".git", ".next", ".vercel", "node_modules"])
  const files = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue

    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(filePath))
    } else if (entry.isFile()) {
      files.push(filePath.replace(/^\.\\/, "").replaceAll("\\", "/"))
    }
  }

  return files
}

function sourceFiles() {
  try {
    return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\0")
      .filter(Boolean)
  } catch {
    return walkSourceFiles()
  }
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length
}

const findings = []
const files = sourceFiles()

for (const file of files) {
  if (ignoredPaths.has(file)) continue

  let content
  try {
    content = readFileSync(file, "utf8")
  } catch {
    continue
  }

  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      findings.push(`${file}:${lineNumber(content, match.index)} ${label}`)
    }
  }

  sensitivePublicName.lastIndex = 0
  for (const match of content.matchAll(sensitivePublicName)) {
    findings.push(`${file}:${lineNumber(content, match.index)} sensitive NEXT_PUBLIC_ variable name`)
  }

  credentialAssignment.lastIndex = 0
  for (const match of content.matchAll(credentialAssignment)) {
    const value = match[1].trim()
    const isPlaceholder = /^(?:\.{3}|<.*>|replace[_ -]|your[_ -]|example[_ -])/i.test(value)
    if (!isPlaceholder) {
      findings.push(`${file}:${lineNumber(content, match.index)} credential-like string literal`)
    }
  }

  if (/^[\s\r\n]*(?:["']use client["'];?)/.test(content)) {
    sensitiveServerReference.lastIndex = 0
    for (const match of content.matchAll(sensitiveServerReference)) {
      findings.push(`${file}:${lineNumber(content, match.index)} server secret referenced by client module`)
    }
  }
}

const forbiddenTrackedFiles = files.filter((file) =>
  /(^|\/)(?:\.env(?:\..+)?|env\.local)$/.test(file) && file !== ".env.example"
)

for (const file of forbiddenTrackedFiles) {
  findings.push(`${file}: tracked environment file`)
}

if (findings.length > 0) {
  console.error("Secret safety check failed:\n" + findings.map((finding) => `- ${finding}`).join("\n"))
  process.exit(1)
}

console.log(`Secret safety check passed (${files.length} repository files scanned).`)
