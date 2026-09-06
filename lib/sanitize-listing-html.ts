import { load } from "cheerio"

const allowed = new Set(["a", "b", "blockquote", "br", "code", "div", "em", "h2", "h3", "h4", "h5", "h6", "hr", "i", "li", "ol", "p", "pre", "s", "span", "strong", "u", "ul"])

/** Server-side allowlist for imported descriptions; never emit scripts or inline styles. */
export function sanitizeListingHtml(value: string) {
  const $ = load(value, {}, false)
  $("script,style,iframe,object,embed,template,svg,math,form,input,button,textarea,select").remove()
  $("h1").each((_, element) => { element.tagName = "h3" })
  $("*").each((_, element) => {
    if (!("tagName" in element)) return
    const node = $(element)
    if (!allowed.has(element.tagName)) { node.replaceWith(node.contents()); return }
    const href = node.attr("href")
    const title = node.attr("title")
    for (const name of Object.keys(element.attribs)) node.removeAttr(name)
    if (element.tagName === "a" && href) {
      try {
        const url = new URL(href, "https://graduatescorner.com")
        if (["http:", "https:", "mailto:"].includes(url.protocol)) {
          node.attr("href", url.href).attr("rel", "noopener noreferrer")
          if (title) node.attr("title", title)
        }
      } catch { /* Keep the text of malformed links. */ }
    }
  })
  return $.html()
}
