const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "u",
  "ul",
])

const allowedAttributes = new Set(["class", "href", "rel", "style", "target", "title"])
const safeUrlProtocols = new Set(["http:", "https:", "mailto:"])
const blockedTags = new Set(["iframe", "object", "script", "style", "template"])
const allowedStyleProperties = new Set(["background-color", "color", "font-family", "font-size"])

function isSafeColor(value: string) {
  return (
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(value)
  )
}

function sanitizeStyle(value: string) {
  return value
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":")
      if (separatorIndex === -1) return ""

      const property = declaration.slice(0, separatorIndex).trim().toLowerCase()
      const rawValue = declaration.slice(separatorIndex + 1).trim()

      if (!allowedStyleProperties.has(property)) return ""

      if ((property === "color" || property === "background-color") && !isSafeColor(rawValue)) {
        return ""
      }

      if (property === "font-size" && !/^\d{1,2}px$/.test(rawValue)) {
        return ""
      }

      if (property === "font-family" && !/^[\w\s"',.-]+$/.test(rawValue)) {
        return ""
      }

      return `${property}: ${rawValue}`
    })
    .filter(Boolean)
    .join("; ")
}

function isSafeUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    return safeUrlProtocols.has(url.protocol)
  } catch {
    return false
  }
}

export function sanitizeHtml(dirtyHtml: string) {
  if (typeof window === "undefined") return ""

  const template = document.createElement("template")
  template.innerHTML = dirtyHtml

  const cleanNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as HTMLElement
    const tagName = element.tagName.toLowerCase()

    if (blockedTags.has(tagName)) {
      element.remove()
      return
    }

    if (!allowedTags.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value

      if (name.startsWith("on") || !allowedAttributes.has(name)) {
        element.removeAttribute(attribute.name)
        continue
      }

      if (name === "style") {
        const safeStyle = sanitizeStyle(value)
        if (safeStyle) {
          element.setAttribute("style", safeStyle)
        } else {
          element.removeAttribute(attribute.name)
        }
        continue
      }

      if (name === "href" && !isSafeUrl(value)) {
        element.removeAttribute(attribute.name)
      }
    }

    if (tagName === "a") {
      element.setAttribute("rel", "noopener noreferrer")
      if (element.getAttribute("target") === "_blank") {
        element.setAttribute("target", "_blank")
      }
    }
  }

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
  const nodes: Node[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach(cleanNode)

  return template.innerHTML
}
