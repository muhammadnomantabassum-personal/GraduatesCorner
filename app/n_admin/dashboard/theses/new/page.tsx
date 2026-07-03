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
import { toNullableUuid } from "@/lib/uuid"
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

export default function AdminNewThesisPage() {
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
  const [organization, setOrganization] = useState("")
  const [organizationType, setOrganizationType] = useState<"university" | "company">("university")

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
        organization: organization || "Admin",
        organization_type: organizationType,
        posted_by: 'admin',
        posted_by_user_id: toNullableUuid(user.id),
        status: 'approved'
      })

    setIsSubmitting(false)

    if (error) {
      toast.error("Failed to submit thesis: " + error.message)
    } else {
      toast.success("Master thesis published successfully!")
      router.push("/n_admin/dashboard/theses")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/n_admin/dashboard/theses"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Master Thesis
        </Link>
        <h1 className="text-xl font-bold text-foreground">Post a Master Thesis</h1>
        <p className="text-sm text-muted-foreground">
          Admin-posted theses are published immediately
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200/60 bg-emerald-50/30 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Admin posting</p>
          <p className="mt-1">
            Theses posted by admin are automatically approved and published immediately
            on the public theses page. No review required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            {/* Organization Info */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="org" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org"
                  placeholder="e.g., Technical University of Munich"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Organization Type <span className="text-destructive">*</span>
                </Label>
                <Select required onValueChange={(v: any) => setOrganizationType(v)} value={organizationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                placeholder="Describe the thesis topic, requirements, and qualifications..."
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
                <SelectTrigger>
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
                placeholder="https://example.com/apply"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Link href="/n_admin/dashboard/theses">
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
                Publish Thesis
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
