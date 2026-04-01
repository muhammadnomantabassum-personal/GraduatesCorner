"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { Button } from "@/components/ui/button"
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon,
  Code as CodeIcon,
  Undo,
  Redo
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  // Function to handle clicks without stealing focus
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    action()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/20 p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 transition-colors", 
          editor.isActive("bold") ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
        )}
        onMouseDown={(e) => handleAction(e, () => editor.chain().focus().toggleBold().run())}
        title="Bold"
      >
        <BoldIcon className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 transition-colors", 
          editor.isActive("italic") ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
        )}
        onMouseDown={(e) => handleAction(e, () => editor.chain().focus().toggleItalic().run())}
        title="Italic"
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 transition-colors", 
          editor.isActive("underline") ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
        )}
        onMouseDown={(e) => handleAction(e, () => editor.chain().focus().toggleUnderline().run())}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 transition-colors", 
          editor.isActive("code") ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
        )}
        onMouseDown={(e) => handleAction(e, () => editor.chain().focus().toggleCode().run())}
        title="Code"
      >
        <CodeIcon className="h-4 w-4" />
      </Button>
      
      <div className="mx-1 h-4 w-px bg-border" />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={(e) => handleAction(e, () => editor.chain().focus().undo().run())}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onMouseDown={(e) => handleAction(e, () => editor.chain().focus().redo().run())}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        strike: false,
        codeBlock: false,
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Pass HTML back to parent
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
  })

  // Sync content from outside only when necessary (initial load or external reset)
  useEffect(() => {
    if (!editor) return
    
    // Check if the editor content is fundamentally different from the prop
    // We ignore empty paragraphs comparison to prevent infinite loops or cursor jumps
    const currentContent = editor.getHTML()
    if (value !== currentContent && value !== "" && (currentContent === "<p></p>" || currentContent === "")) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  return (
    <div className="flex flex-col rounded-md border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
