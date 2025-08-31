"use client"
import React, { useEffect, useRef, useState } from "react"
import { X, Send, MessageSquare } from "lucide-react"

type Message = {
  id: string
  from: "leo" | "user"
  text: string
}

export default function LeoChatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      from: "leo",
      text: "Hi — I'm Leo. Tell me what you're studying or the kind of group you're after, and I'll find a match."
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

  function submit() {
    if (!input.trim()) return
    const userMsg: Message = { id: String(Date.now()), from: "user", text: input.trim() }
    setMessages((m) => [...m, userMsg])
    setInput("")

    // simulated Leo response (placeholders)
    setTimeout(() => {
      const reply: Message = {
        id: "r" + Date.now(),
        from: "leo",
        text:
          "Here are a few matches (placeholders):\n\n• COMP30024 — Algorithms Study Group — Wed 6pm\n• BIOM3001 — Biochemistry Notes Crew — Thu 7pm\n• LAWS5002 — Exam Prep — Sat 10am\n\nTap any item later to view the real group."
      }
      setMessages((m) => [...m, reply])
    }, 700)
  }

  const quickPrompts = [
    "COMP30024 evenings",
    "Biochemistry weekend",
    "Exam prep groups",
  ]

  return (
    // fixed container prevents layout shift when the chat opens
    <div ref={containerRef} className="fixed bottom-16 right-8 z-50">
      {/* Collapsed toggle (stays in DOM for smoother animation) */}
      <div className={`transform origin-bottom-right transition-all duration-300 ease-out ${open ? "opacity-0 scale-90 translate-y-4 pointer-events-none" : "opacity-100 scale-100 translate-y-0"}`}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 shadow-lg transition-colors duration-200"
          aria-label="Open Leo chat"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-deep-blue font-bold text-lg">L</div>
          <div className="text-left">
            <div className="text-lg font-serif font-semibold text-white">Ask Leo to find a study group</div>
            <div className="text-sm text-blue-100">Try: "COMP30024 evenings"</div>
          </div>
          <div className="ml-3 text-white/90 p-2 rounded-md bg-white/5">
            <MessageSquare className="h-5 w-5" />
          </div>
        </button>
      </div>

      {/* Expanded panel (also remains in DOM for animation) */}
      <div className={`transform origin-bottom-right transition-all duration-300 ease-out ${open ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-6 pointer-events-none"}`}>
        <div
          role="dialog"
          aria-modal="true"
          className="w-[540px] h-[600px] bg-gradient-to-br from-white/6 to-white/3 border border-white/20 rounded-3xl shadow-2xl backdrop-blur-lg p-5 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-deep-blue font-bold text-lg">L</div>
              <div>
                <div className="text-xl font-serif font-semibold text-white">Leo — AI Study Finder</div>
                <div className="text-sm text-blue-100">I'll search MelbMinds and suggest groups for you.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close Leo"
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
                aria-label="Message Leo"
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
            <div className="text-xs text-blue-100 mt-2">Leo is a visual prototype — results are placeholders for now.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
