"use client"

import { useEffect } from "react"
import { Mark, mergeAttributes } from "@tiptap/core"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bold,
  Eraser,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

const fontFamilies = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
]

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"]
const highlightColors = ["#FEF3C7", "#DBEAFE", "#DCFCE7", "#FCE7F3", "#EDE9FE"]

const RichTextStyle = Mark.create({
  name: "richTextStyle",
  priority: 1000,

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily?.replace(/['"]/g, "") || null,
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
      },
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
      },
    }
  },

  parseHTML() {
    return [{ tag: "span[style]" }]
  },

  renderHTML({ HTMLAttributes }) {
    const { fontFamily, fontSize, color, backgroundColor, ...safeAttributes } = HTMLAttributes
    const styles = [
      fontFamily ? `font-family: ${fontFamily}` : "",
      fontSize ? `font-size: ${fontSize}` : "",
      color ? `color: ${color}` : "",
      backgroundColor ? `background-color: ${backgroundColor}` : "",
    ].filter(Boolean)

    return [
      "span",
      mergeAttributes(safeAttributes, {
        style: styles.join("; "),
      }),
      0,
    ]
  },
})

function ToolbarButton({
  active,
  title,
  onMouseDown,
  children,
}: {
  active?: boolean
  title: string
  onMouseDown: (event: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "h-8 w-8 rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent"
      )}
      onMouseDown={onMouseDown}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  )
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const run = (event: React.MouseEvent, action: () => void) => {
    event.preventDefault()
    action()
  }

  const setRichStyle = (attrs: Record<string, string | null>) => {
    const current = editor.getAttributes("richTextStyle")
    editor.chain().focus().setMark("richTextStyle", { ...current, ...attrs }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/30 p-2">
      <select
        aria-label="Paragraph style"
        className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus:border-primary"
        onChange={(event) => {
          const value = event.target.value
          if (value === "paragraph") editor.chain().focus().setParagraph().run()
          if (value === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run()
          if (value === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run()
          event.currentTarget.value = ""
        }}
        defaultValue=""
      >
        <option value="" disabled>Style</option>
        <option value="paragraph">Paragraph</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <select
        aria-label="Font family"
        className="h-8 w-28 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus:border-primary"
        defaultValue=""
        onChange={(event) => {
          setRichStyle({ fontFamily: event.target.value })
          event.currentTarget.value = ""
        }}
      >
        <option value="" disabled>Font</option>
        {fontFamilies.map((font) => (
          <option key={font.label} value={font.value}>{font.label}</option>
        ))}
      </select>

      <select
        aria-label="Font size"
        className="h-8 w-20 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus:border-primary"
        defaultValue=""
        onChange={(event) => {
          setRichStyle({ fontSize: event.target.value })
          event.currentTarget.value = ""
        }}
      >
        <option value="" disabled>Size</option>
        {fontSizes.map((size) => (
          <option key={size} value={size}>{size.replace("px", "")}</option>
        ))}
      </select>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleBold().run())}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleItalic().run())}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive("underline")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleUnderline().run())}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive("strike")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleStrike().run())}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        title="Bulleted list"
        active={editor.isActive("bulletList")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleBulletList().run())}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleOrderedList().run())}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onMouseDown={(event) => run(event, () => editor.chain().focus().toggleBlockquote().run())}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <label
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Text color"
        aria-label="Text color"
      >
        <Palette className="h-4 w-4" />
        <input
          type="color"
          className="sr-only"
          onInput={(event) => setRichStyle({ color: event.currentTarget.value })}
        />
      </label>
      <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1 py-1">
        <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
        {highlightColors.map((color) => (
          <button
            key={color}
            type="button"
            title="Highlight"
            aria-label="Highlight"
            className="h-5 w-5 rounded-sm border border-border transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
            onMouseDown={(event) => run(event, () => setRichStyle({ backgroundColor: color }))}
          />
        ))}
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        title="Clear formatting"
        onMouseDown={(event) =>
          run(event, () =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          )
        }
      >
        <Eraser className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Undo"
        onMouseDown={(event) => run(event, () => editor.chain().focus().undo().run())}
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        onMouseDown={(event) => run(event, () => editor.chain().focus().redo().run())}
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <div className="ml-auto hidden items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:flex">
        <Type className="h-3.5 w-3.5" />
        Rich text
      </div>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 260,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      RichTextStyle,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-surface prose prose-sm max-w-none p-4 focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5",
        style: `min-height: ${minHeight}px;`,
        "data-placeholder": placeholder || "",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentContent = editor.getHTML()
    if (value !== currentContent && value !== "") {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
