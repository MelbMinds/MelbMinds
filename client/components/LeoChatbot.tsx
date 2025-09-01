"use client"
import React, { useEffect, useRef, useState } from "react"
import { X, Send, MessageSquare } from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  from: "leo" | "user"
  text: string
  groups?: any[]
}
export default function LeoChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      from: "leo",
      text: "Hi — I'm Leon. Tell me what you're studying or the kind of group you're after, and I'll find a match."
    }
  ])

  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      // if click outside and panel is open -> close
      if (open && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("click", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Listen for onboarding tutorial event to open chatbox
  useEffect(() => {
    const handleOpenLeo = () => setOpen(true)
    window.addEventListener('openLeoChatbot', handleOpenLeo)
    return () => window.removeEventListener('openLeoChatbot', handleOpenLeo)
  }, [])

  async function submit() {
    if (!input.trim()) return
    const query = input.trim()
    const userMsg: Message = { id: String(Date.now()), from: "user", text: query }
    setMessages((m) => [...m, userMsg])
    setInput("")

    // Simulate a search response with dummy groups (no backend call)
    setTimeout(() => {
      const dummyGroups = [
        {
          id: "g1",
          group_name: `${query} — Algorithms Study Group`,
          subject_code: "COMP30024",
          meeting_format: "In-person",
          meeting_schedule: "Wed 6pm",
          description: "Friendly students focusing on weekly problem sets and exam prep.",
        },
        {
          id: "g2",
          group_name: `${query} — Biochem Notes Crew`,
          subject_code: "BIOM3001",
          meeting_format: "Virtual",
          meeting_schedule: "Thu 7pm",
          description: "Shared notes, flashcards and weekly quizzes.",
        },
        {
          id: "g3",
          group_name: `${query} — Exam Prep Squad`,
          subject_code: "LAWS5002",
          meeting_format: "Hybrid",
          meeting_schedule: "Sat 10am",
          description: "Focused review sessions with past paper run-throughs.",
        },
      ]

      const reply: Message = {
        id: "r" + Date.now(),
        from: "leo",
        text: `I found ${dummyGroups.length} groups matching "${query}". Here are the top results:`,
        groups: dummyGroups,
      }
      setMessages((m) => [...m, reply])
    }, 600)
  }

  const quickPrompts = [
    "COMP30024 evenings",
    "Biochemistry weekend",
    "Exam prep groups",
  ]

  return (
  // render as a right-side column positioned within the hero so Leon stays anchored to that section
  <div ref={containerRef} className="leo-chatbot-container absolute z-50 inset-y-0 right-0 flex items-center justify-end pointer-events-none">
      {/* Collapsed toggle (stays in DOM for smoother animation) */}
  {/* Collapsed right rail preview: fills the right area but stays subtle until opened */}
  <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-end transition-all duration-200 ease-out pointer-events-auto ${open ? "opacity-0 translate-x-full pointer-events-none" : "opacity-100 translate-x-0"}`}>
        {/* desktop rail */}
        <div
          onClick={() => setOpen(true)}
          role="button"
          aria-label="Open Leo chat"
          className="hidden lg:flex w-[30vw] min-w-[280px] max-w-[420px] h-[62vh] mr-0 bg-gradient-to-br from-[#0b334a]/40 to-[#09293b]/30 border border-white/10 rounded-l-2xl backdrop-blur-md p-5 flex-col justify-center gap-3 cursor-pointer hover:from-[#0b3a54]/45 hover:to-[#083045]/35 shadow-[0_10px_30px_rgba(2,6,23,0.45)]"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-deep-blue font-bold text-lg shadow-sm">L</div>
            <div className="text-left flex-1">
              <div className="text-lg font-serif font-semibold text-white">Ask Leon to find a study group</div>
              <div className="text-sm text-blue-100 mt-1">Try: "COMP30024 evenings"</div>
              <div className="text-xs text-blue-100 mt-3">Leon can search groups and surface matches directly in this panel.</div>
            </div>
          </div>
        </div>
        {/* mobile: small floating button bottom-right */}
        <div className="lg:hidden absolute -left-[140px] bottom-6 transform rotate-0"></div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Leon chat"
          className="lg:hidden absolute z-50 right-2 bottom-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#ffd27a] to-[#ffc34a] flex items-center justify-center text-deep-blue shadow-[0_8px_24px_rgba(2,6,23,0.3)] border border-white/20"
        >
          <div className="font-bold">L</div>
        </button>
      </div>

      {/* Expanded panel (also remains in DOM for animation) */}
      {/* Expanded panel: slide in/out from the right and occupy the right column */}
  <div className={`absolute -right-24 top-1/2 -translate-y-1/2 transform transition-transform duration-300 ease-out pointer-events-auto ${open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
        <div
          role="dialog"
          aria-modal="true"
          className="w-[46vw] max-w-[780px] min-w-[320px] h-[62vh] bg-gradient-to-br from-[#072033]/70 to-[#082d45]/60 border-l border-white/10 rounded-l-2xl shadow-[0_20px_60px_rgba(2,6,23,0.6)] backdrop-blur-md p-6 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-deep-blue font-bold text-lg">L</div>
              <div>
                <div className="text-2xl font-serif font-semibold text-white">Leon — AI Study Finder</div>
                <div className="text-sm text-blue-100">I'll search MelbMinds and suggest groups for you.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close Leon"
                className="p-2 rounded-md hover:bg-white/10"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 pr-2">
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === "leo" ? "items-start" : "justify-end"}`}>
                  {m.from === "leo" && (
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-deep-blue font-semibold mr-3">L</div>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap break-words px-4 py-3 rounded-xl ${
                      m.from === "leo" ? "bg-white/6 text-white" : "bg-white text-deep-blue"
                    }`}
                  >
                    <div className="text-sm leading-relaxed"><pre className="whitespace-pre-wrap break-words m-0">{m.text}</pre></div>
                    {m.groups && m.groups.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {m.groups.map((g, i) => (
                          <div key={g.id || i} className="bg-white/5 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 pr-2">
                                <div className="text-sm font-semibold text-white line-clamp-1">{g.group_name || g.title}</div>
                                <div className="text-xs text-blue-100 mt-1">{g.subject_code || g.subject} • {g.meeting_format || g.format} • {g.meeting_schedule || ''}</div>
                                <div className="text-xs text-blue-100 mt-2 line-clamp-2">{g.description}</div>
                              </div>
                              <div className="ml-3">
                                <Link href={`/group/${g.id}`} className="inline-block bg-gold text-deep-blue px-3 py-1 rounded-full text-xs">View</Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); }}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 text-blue-100 hover:bg-white/10"
                >
                  {p}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="flex items-center gap-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-white/5 text-white placeholder-blue-100 rounded-full px-4 py-3 focus:outline-none"
                placeholder="Describe what you're looking for (e.g. 'weekly COMP30024, friendly')"
                aria-label="Message Leon"
              />
              <button
                type="submit"
                className="bg-gold text-deep-blue px-4 py-2 rounded-full shadow-sm hover:brightness-95 flex items-center gap-2"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
                <span className="text-sm font-medium">Ask</span>
              </button>
            </form>
            <div className="text-xs text-blue-100 mt-2">Leon is a visual prototype — results are placeholders for now.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
