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
import { ArrowLeft, Send, Info, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { htmlToPlainText } from "@/lib/text"

const subjects = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Industrial Engineering",
  "Physics",
  "Energy Engineering",
  "Information Systems",
  "Business Administration",
  "Mathematics",
  "Biology",
  "Chemistry",
]

export default function NewCompanyThesisPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [title, setTitle] = useState("")
  const [thesisType] = useState<"master" | "phd">("master")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [deadline, setDeadline] = useState("")
  const [compensation, setCompensation] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [customSubject, setCustomSubject] = useState("")

  const supabase = createClient()

  const toggleSubject = (s: string) => {
    if (selectedSubjects.includes(s)) {
      setSelectedSubjects(selectedSubjects.filter((item) => item !== s))
    } else {
      if (selectedSubjects.length < 5) {
        setSelectedSubjects([...selectedSubjects, s])
      } else {
        toast.error("You can select up to 5 subject areas")
      }
    }
  }

  const addCustomSubject = () => {
    const trimmed = customSubject.trim()
    if (!trimmed) return
    if (selectedSubjects.includes(trimmed)) {
      setCustomSubject("")
      return
    }
    if (selectedSubjects.length < 5) {
      setSelectedSubjects([...selectedSubjects, trimmed])
      setCustomSubject("")
    } else {
      toast.error("You can select up to 5 subject areas")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("You must be logged in to post a thesis")
      return
    }

    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject area")
      return
    }

    if (!htmlToPlainText(description)) {
      toast.error("Please add a description")
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase
      .from('theses')
      .insert({
        title,
        type: thesisType,
        subject: selectedSubjects.join(", "),
        description,
        location,
        deadline,
        compensation,
        external_url: externalUrl,
        organization: user.organization || user.name || "Company",
        organization_type: 'company',
        posted_by: user.type,
        posted_by_user_id: user.id,
        status: 'pending'
      })

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to submit thesis: " + error.message)
    } else {
      toast.success("Thesis submitted for review!", {
        description: "You'll be notified once it's approved by an admin.",
      })
      router.push("/dashboard/company/theses")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/company/theses"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Master Thesis
        </Link>
        <h1 className="text-xl font-bold text-foreground">Post a Master Thesis</h1>
        <p className="text-sm text-muted-foreground">
          Create a new master thesis position for students to discover
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">How thesis posting works</p>
          <p className="mt-1">
            Your thesis will be reviewed by our admin team before publishing.
            Once approved, it will appear on the public theses page for students to browse.
            You can track the status of your submissions in the my thesis section.
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
                Thesis Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Deep Learning for Climate Modeling"
                required
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Subject Area (Select 1-5) <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedSubjects.includes(s)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {selectedSubjects.filter(s => !subjects.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Add custom subject..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomSubject()
                    }
                  }}
                  className="h-9 text-xs"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addCustomSubject}
                  className="h-9 shrink-0"
                >
                  Add
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Selected: {selectedSubjects.length}/5
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                placeholder="Describe the thesis topic, requirements, expected outcomes, and candidate qualifications..."
                value={description}
                onChange={setDescription}
                minHeight={300}
              />
            </div>

            {/* Location + Deadline */}
            <div className="grid gap-5 sm:grid-cols-2">
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

            {/* Compensation */}
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

            {/* External URL */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="url" className="text-sm font-medium">
                External Application URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-company.com/careers"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <Link href="/dashboard/company/theses">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
