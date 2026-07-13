"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Send, Info, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { htmlToPlainText } from "@/lib/text"

const fields = [
  "Engineering",
  "Data Science",
  "Technology",
  "Business & Management",
  "Finance",
  "Marketing",
  "Energy & Sustainability",
  "Healthcare",
  "Research & Development",
  "Supply Chain & Logistics",
]

const durations = [
  "6 months",
  "12 months",
  "18 months",
  "24 months",
  "36 months",
]

export default function NewTraineeProgramPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [location, setLocation] = useState("")
  const [compensation, setCompensation] = useState("")
  const [deadline, setDeadline] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [customField, setCustomField] = useState("")
  const [customDuration, setCustomDuration] = useState("")
  const [showCustomDuration, setShowCustomDuration] = useState(false)

  const supabase = createClient()

  const toggleField = (f: string) => {
    if (selectedFields.includes(f)) {
      setSelectedFields(selectedFields.filter((item) => item !== f))
    } else {
      if (selectedFields.length < 5) {
        setSelectedFields([...selectedFields, f])
      } else {
        toast.error("You can select up to 5 fields")
      }
    }
  }

  const addCustomField = () => {
    const trimmed = customField.trim()
    if (!trimmed) return
    if (selectedFields.includes(trimmed)) {
      setCustomField("")
      return
    }
    if (selectedFields.length < 5) {
      setSelectedFields([...selectedFields, trimmed])
      setCustomField("")
    } else {
      toast.error("You can select up to 5 fields")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("You must be logged in to post a program")
      return
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field")
      return
    }

    const finalDuration = showCustomDuration ? `${customDuration} months` : duration
    if (!finalDuration) {
      toast.error("Please provide a duration")
      return
    }

    if (!htmlToPlainText(description)) {
      toast.error("Please add a description")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase
      .from('trainee_programs')
      .insert({
        title,
        company: user.organization || user.name || "Company",
        description,
        field: selectedFields.join(", "),
        location,
        duration: finalDuration,
        compensation,
        deadline,
        external_url: externalUrl,
        posted_by: user.type,
        posted_by_user_id: user.id,
        status: 'pending'
      })

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to submit the program. Please try again.")
    } else {
      toast.success("Trainee program submitted for review!", {
        description: "You'll be notified once it's approved by an admin.",
      })
      router.push("/dashboard/company/trainee-programs")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/company/trainee-programs"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to My Programs
        </Link>
        <h1 className="text-xl font-bold text-foreground">Post a Trainee Program</h1>
        <p className="text-sm text-muted-foreground">
          Create a new graduate trainee program for candidates to discover
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">How program posting works</p>
          <p className="mt-1">
            Your trainee program will be reviewed by our admin team before publishing.
            Once approved, it will appear on the public trainee programs page for candidates to browse.
            You can track the status of your submissions in the My Programs section.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Program Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Graduate Engineering Trainee Program"
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Field */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Fields (Select 1-5) <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {fields.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleField(f)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFields.includes(f)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {f}
                  </button>
                ))}
                {selectedFields.filter(f => !fields.includes(f)).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleField(f)}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors"
                  >
                    {f}
                  </button>
                ))}
              </div>
              
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Add custom field..."
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomField()
                    }
                  }}
                  className="h-9 text-xs"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addCustomField}
                  className="h-9 shrink-0"
                >
                  Add
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Selected: {selectedFields.length}/5
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                placeholder="Describe the trainee program, rotations, learning opportunities, and candidate requirements..."
                value={description}
                onChange={setDescription}
                minHeight={300}
              />
            </div>

            {/* Duration + Location */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Duration <span className="text-destructive">*</span>
                </Label>
                {!showCustomDuration ? (
                  <div className="flex gap-2">
                    <Select 
                      required={!showCustomDuration} 
                      onValueChange={(v) => {
                        if (v === "custom") {
                          setShowCustomDuration(true)
                          setDuration("")
                          setCustomDuration("1")
                        } else {
                          setDuration(v)
                        }
                      }} 
                      value={duration}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                        <SelectItem value="custom" className="font-medium text-primary">Custom Duration...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="1"
                        required={showCustomDuration}
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="pr-16"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        months
                      </span>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setShowCustomDuration(false)
                        setCustomDuration("")
                      }}
                      className="h-10 w-10 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="location" 
                  placeholder="e.g., Munich, Germany" 
                  required 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Compensation + Deadline */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Compensation <span className="text-destructive">*</span>
                </Label>
                <Select required onValueChange={setCompensation} value={compensation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select compensation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="stipend">Stipend</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="deadline" className="text-sm font-medium">
                  Application Deadline <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="deadline" 
                  type="date" 
                  required 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* External URL */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="url" className="text-sm font-medium">
                External Application URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-company.com/apply"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <Link href="/dashboard/company/trainee-programs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
