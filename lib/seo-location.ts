import { locations } from "./data/locations"
const codes: Record<string,string> = { Germany:"DE",Sweden:"SE",Norway:"NO",Finland:"FI",Netherlands:"NL","United Kingdom":"GB",Switzerland:"CH",France:"FR",Austria:"AT",Denmark:"DK",Belgium:"BE",Spain:"ES",Italy:"IT",Ireland:"IE",Poland:"PL",Portugal:"PT",Greece:"GR",Hungary:"HU",Romania:"RO",Luxembourg:"LU",Estonia:"EE",Croatia:"HR",Slovenia:"SI",Slovakia:"SK",Bulgaria:"BG",Latvia:"LV",Lithuania:"LT",Iceland:"IS",Ukraine:"UA","United States":"US",Canada:"CA",Australia:"AU","New Zealand":"NZ",Japan:"JP",China:"CN",Singapore:"SG",India:"IN","South Korea":"KR",Brazil:"BR","South Africa":"ZA" }
const normalize = (value:string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase()
const aliases: Record<string,string> = { sverige:"Sweden",norge:"Norway",suomi:"Finland",nederland:"Netherlands",deutschland:"Germany",uk:"United Kingdom",usa:"United States",goteborg:"Sweden",sodertalje:"Sweden",linkoping:"Sweden" }
export function seoCountry(value:string): {name:string;code:string} | null {
  const clean = normalize(value)
  const explicit = Object.keys(codes).filter(name => new RegExp(`\\b${name.toLowerCase()}\\b`).test(clean))
  if (explicit.length === 1) return { name:explicit[0],code:codes[explicit[0]] }
  if (explicit.length > 1) return null // Do not collapse multinational locations into one country.
  const parts = clean.split(/[,;|]/).map(part=>part.trim())
  for (const part of parts) {
    const name = aliases[part] || Object.keys(codes).find(name=>codes[name].toLowerCase() === part)
    if (name) return {name,code:codes[name]}
  }
  const inferred = locations.filter(item=>codes[item.country] && item.cities.some(city=>parts.includes(normalize(city))))
  return inferred.length===1 ? {name:inferred[0].country,code:codes[inferred[0].country]} : null
}
