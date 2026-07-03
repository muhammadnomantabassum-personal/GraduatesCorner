/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og"
import { getPhdShareData } from "@/lib/opportunity-share"

export const runtime = "edge"
export const alt = "Graduates Corner PhD position"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()
}

function formatDeadline(value?: string) {
  if (!value) return "Deadline listed"

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const position = await getPhdShareData(id)
  const organization = position?.organization || "Graduates Corner"
  const title = position?.title || "PhD Position"
  const subject = position?.subject || "Research opportunity"
  const location = position?.location || "International"
  const deadline = formatDeadline(position?.deadline)

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #ECFDF5 100%)",
          color: "#111827",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 56,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(66,133,244,0.18)",
            borderRadius: 42,
            boxShadow: "0 30px 90px rgba(15,23,42,0.16)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            padding: 48,
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 42,
              height: "100%",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)",
                border: "1px solid rgba(17,24,39,0.08)",
                borderRadius: 34,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75), 0 22px 48px rgba(66,133,244,0.12)",
                display: "flex",
                height: 380,
                justifyContent: "center",
                overflow: "hidden",
                padding: 34,
                width: 380,
              }}
            >
              {position?.logoUrl ? (
                <img
                  alt={`${organization} logo`}
                  src={position.logoUrl}
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    alignItems: "center",
                    background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
                    borderRadius: 30,
                    color: "white",
                    display: "flex",
                    fontSize: 88,
                    fontWeight: 800,
                    height: "100%",
                    justifyContent: "center",
                    letterSpacing: 0,
                    width: "100%",
                  }}
                >
                  {getInitials(organization)}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
              <div
                style={{
                  alignItems: "center",
                  color: "#4285F4",
                  display: "flex",
                  fontSize: 28,
                  fontWeight: 800,
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    background: "#4285F4",
                    borderRadius: 999,
                    display: "flex",
                    height: 14,
                    width: 14,
                  }}
                />
                PhD Position
              </div>

              <div
                style={{
                  color: "#0F172A",
                  display: "flex",
                  fontSize: title.length > 82 ? 46 : 54,
                  fontWeight: 800,
                  lineHeight: 1.06,
                  marginBottom: 24,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  color: "#334155",
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  marginBottom: 30,
                }}
              >
                {organization}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                  marginTop: "auto",
                }}
              >
                {[subject, location, `Deadline: ${deadline}`].map((item) => (
                  <div
                    key={item}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid rgba(15,23,42,0.08)",
                      borderRadius: 16,
                      color: "#334155",
                      display: "flex",
                      fontSize: 22,
                      fontWeight: 700,
                      padding: "12px 18px",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              bottom: 30,
              color: "#64748B",
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              position: "absolute",
              right: 48,
              zIndex: 3,
            }}
          >
            graduatescorner.com
          </div>
        </div>
      </div>
    ),
    size
  )
}
