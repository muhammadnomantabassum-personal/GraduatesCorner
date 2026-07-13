import "server-only"

import crypto from "node:crypto"

const HASH_PREFIX = "pbkdf2-sha512"
const ITERATIONS = 210_000
const KEY_LENGTH = 64

function safeEqual(left: string | Buffer, right: string | Buffer) {
  const leftBuffer = Buffer.isBuffer(left) ? left : Buffer.from(left)
  const rightBuffer = Buffer.isBuffer(right) ? right : Buffer.from(right)

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(24).toString("base64url")
  const digest = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("base64url")

  return `${HASH_PREFIX}$${ITERATIONS}$${salt}$${digest}`
}

export function verifyAdminPassword(password: string, storedPassword: string) {
  const [prefix, iterationsValue, salt, expectedDigest] = storedPassword.split("$")

  if (prefix !== HASH_PREFIX || !iterationsValue || !salt || !expectedDigest) {
    return { valid: false, needsUpgrade: false }
  }

  const iterations = Number(iterationsValue)
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) {
    return { valid: false, needsUpgrade: false }
  }

  const actualDigest = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha512")
    .toString("base64url")

  return {
    valid: safeEqual(actualDigest, expectedDigest),
    needsUpgrade: iterations !== ITERATIONS,
  }
}

export function verifyAdminIdentifier(identifier: string, expectedIdentifier: string) {
  return safeEqual(identifier, expectedIdentifier)
}
