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
  "span",
  "strong",
  "u",
  "ul",
])

const allowedAttributes = new Set(["class", "href", "rel", "target", "title"])
const safeUrlProtocols = new Set(["http:", "https:", "mailto:"])
const blockedTags = new Set(["iframe", "object", "script", "style", "template"])

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
