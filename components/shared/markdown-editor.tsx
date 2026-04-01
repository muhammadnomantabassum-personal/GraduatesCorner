"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Quote
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder, 
  rows = 14,
  className 
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      )
    }, 0)
  }

  const tools = [
    { 
      icon: Heading1, 
      label: "Heading 1", 
      action: () => insertText("# ", "") 
    },
    { 
      icon: Heading2, 
      label: "Heading 2", 
      action: () => insertText("## ", "") 
    },
    { 
      icon: Bold, 
      label: "Bold", 
      action: () => insertText("**", "**") 
    },
    { 
      icon: Italic, 
      label: "Italic", 
      action: () => insertText("_", "_") 
    },
    { 
      icon: List, 
      label: "Bullet List", 
      action: () => insertText("- ", "") 
    },
    { 
      icon: ListOrdered, 
      label: "Numbered List", 
      action: () => insertText("1. ", "") 
    },
    { 
      icon: Quote, 
      label: "Quote", 
      action: () => insertText("> ", "") 
    },
    { 
      icon: LinkIcon, 
      label: "Link", 
      action: () => insertText("[", "](url)") 
    },
  ]

  return (
    <div className={cn("flex flex-col rounded-md border border-input bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/20 p-1">
        {tools.map((tool, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={tool.action}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      
      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}
