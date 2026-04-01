"use client"

import { useEffect, useState, useCallback } from "react"
import { Quote } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

const testimonials = [
  {
    quote:
      "GraduatesCorner connected me with my dream thesis at Ericsson. The platform made it incredibly easy to find relevant opportunities in my field.",
    name: "Anna Svensson",
    initials: "AS",
    role: "MSc Graduate · KTH → Ericsson",
  },
  {
    quote:
      "We found three exceptional thesis students through GraduatesCorner. The quality of applicants exceeded all our expectations.",
    name: "Erik Lindqvist",
    initials: "EL",
    role: "R&D Manager · Volvo Group",
  },
  {
    quote:
      "The collaboration tools made supervising remote thesis projects seamless. Our students consistently deliver better results now.",
    name: "Maria Johansson",
    initials: "MJ",
    role: "Professor · Lund University",
  },
  {
    quote:
      "I landed my internship at Spotify through GraduatesCorner. The process was smooth and the matching algorithm really works.",
    name: "Oscar Bergström",
    initials: "OB",
    role: "Software Engineer · Chalmers → Spotify",
  },
  {
    quote:
      "As a startup, finding research talent was difficult until we joined GraduatesCorner. It leveled the playing field for us.",
    name: "Sara Nilsson",
    initials: "SN",
    role: "CTO · NordicAI",
  },
]

const INTERVAL = 3000 // 3 seconds

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, INTERVAL)
    return () => clearInterval(timer)
  }, [next])

  const t = testimonials[current]

  return (
    <div className="relative z-10">
      <div className="relative overflow-hidden rounded-xl border border-primary-foreground/8 bg-primary-foreground/[0.05] p-4 backdrop-blur-sm xl:p-5">
        <Quote className="mb-1.5 h-4 w-4 text-accent/50 xl:mb-2 xl:h-5 xl:w-5" />

        <div className="relative min-h-[100px] xl:min-h-[110px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <p className="mb-2.5 text-[12.5px] italic leading-[1.65] text-primary-foreground/65 xl:mb-3 xl:text-[13.5px]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-2 xl:gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-[9px] font-semibold text-primary-foreground xl:h-8 xl:w-8 xl:text-[10px]">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[12px] font-medium text-primary-foreground/90 xl:text-[13px]">
                    {t.name}
                  </p>
                  <p className="text-[10px] text-primary-foreground/38 xl:text-[11px]">
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1)
              setCurrent(i)
            }}
            className="group relative h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === current ? 16 : 6 }}
            aria-label={`Go to testimonial ${i + 1}`}
          >
            <span
              className="absolute inset-0 rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  i === current
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.2)",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
