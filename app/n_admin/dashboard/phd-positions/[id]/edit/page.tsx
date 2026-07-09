"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Eye, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/shared/rich-text-editor"
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

type PhdStatus = "approved" | "pending" | "rejected"

export default function EditAdminPhDPositionPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [deadline, setDeadline] = useState("")
  const [compensation, setCompensation] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [customSubject, setCustomSubject] = useState("")
  const [organization, setOrganization] = useState("")
  const [organizationType, setOrganizationType] = useState<"university" | "company">("university")
  const [status, setStatus] = useState<PhdStatus>("approved")

  useEffect(() => {
    let active = true

    const fetchPhdPosition = async () => {
      setIsLoading(true)
      const response = await fetch(`/api/admin/theses/${id}`)
      const result = await response.json().catch(() => ({}))

      if (!active) return

      if (!response.ok) {
        toast.error("Failed to load PhD position")
      } else if (!result.thesis || result.thesis.type !== "phd") {
        toast.error("PhD position not found")
        router.push("/n_admin/dashboard/phd-positions")
      } else {
        const data = result.thesis
        setTitle(data.title || "")
        setSelectedSubjects(
          data.subject
            ? data.subject.split(",").map((subject: string) => subject.trim()).filter(Boolean)
            : []
        )
        setDescription(data.description || "")
        setLocation(data.location || "")
        setDeadline(data.deadline ? String(data.deadline).slice(0, 10) : "")
        setCompensation(data.compensation || "")
        setExternalUrl(data.external_url || "")
        setOrganization(data.organization || "")
        setOrganizationType(data.organization_type === "company" ? "company" : "university")
        setStatus((data.status || "pending") as PhdStatus)
      }

      setIsLoading(false)
    }

    fetchPhdPosition()

    return () => {
      active = false
    }
  }, [id, router])

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((item) => item !== subject))
    } else if (selectedSubjects.length < 5) {
      setSelectedSubjects([...selectedSubjects, subject])
    } else {
      toast.error("You can select up to 5 subject areas")
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (selectedSubjects.length === 0) {
      toast.error("Please select at least one subject area")
      return
    }

    if (!htmlToPlainText(description)) {
      toast.error("Please add a description")
      return
    }

    setIsSubmitting(true)

    const response = await fetch(`/api/admin/theses/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        type: "phd",
        subject: selectedSubjects.join(", "),
        description,
        location,
        deadline,
        compensation,
        external_url: externalUrl,
        organization,
        organization_type: organizationType,
        status,
      }),
    })
    const result = await response.json().catch(() => ({}))

    setIsSubmitting(false)

    if (!response.ok) {
      toast.error("Failed to update PhD position: " + (result.error || "Unknown error"))
    } else {
      toast.success("PhD position updated successfully")
      router.push("/n_admin/dashboard/phd-positions")
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading PhD position...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/n_admin/dashboard/phd-positions"
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to PhD Positions
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground font-sans">Edit PhD Position</h1>
            <p className="text-sm text-muted-foreground">
              Update details, formatting, and publication status for this listing.
            </p>
          </div>
          <Link href={`/phd-positions/${id}`}>
            <Button type="button" variant="outline" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              View Public Page
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="org" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org"
                  placeholder="e.g., ETH Zurich"
                  required
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Organization Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  onValueChange={(value) => setOrganizationType(value as "university" | "company")}
                  value={organizationType}
                >
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Publication Status <span className="text-destructive">*</span>
                </Label>
                <Select required onValueChange={(value) => setStatus(value as PhdStatus)} value={status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved / Published</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-sm font-medium">
                PhD Position Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Quantum Computing Research"
                required
                maxLength={150}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Subject Area (Select 1-5) <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedSubjects.includes(subject)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
                {selectedSubjects.filter((subject) => !subjects.includes(subject)).map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors"
                  >
                    {subject}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Add custom subject..."
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
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

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                placeholder="Describe the research topic, candidate profile, responsibilities, and benefits..."
                value={description}
                onChange={setDescription}
                minHeight={320}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Zurich, Switzerland"
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
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
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </div>
            </div>

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
                onChange={(event) => setExternalUrl(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Link href="/n_admin/dashboard/phd-positions">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
