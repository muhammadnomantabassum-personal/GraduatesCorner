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

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const position = await getPhdShareData(id)
  const organization = position?.organization || "Graduates Corner"

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#FFFFFF",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#FFFFFF",
            display: "flex",
            height: 460,
            justifyContent: "center",
            width: 760,
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
                borderRadius: 48,
                color: "white",
                display: "flex",
                fontSize: 168,
                fontWeight: 800,
                height: 360,
                justifyContent: "center",
                letterSpacing: 0,
                width: 360,
              }}
            >
              {getInitials(organization)}
            </div>
          )}
        </div>
      </div>
    ),
    size
  )
}
