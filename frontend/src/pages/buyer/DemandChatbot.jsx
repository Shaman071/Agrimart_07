// DemandChatbot - Buyer's demand forecast chatbot with premium UI
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Send, Bot, User, BarChart3, TrendingUp, TrendingDown, Sparkles, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SAMPLE_QUERIES = [
  'Tomato price trend in Bangalore',
  'Onion market arrivals in Mysore',
  'Best time to buy Rice this month',
  'Chilli price forecast',
  'Wholesale potato rates Karnataka',
  'Coconut prices near Mangalore',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  )
}

export default function DemandChatbot() {
  const { profile, user } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm AgriMart's demand forecast assistant.\n\nAsk me about **crop prices**, **market trends**, **arrival volumes**, or **buying advice** for any crop across Karnataka districts.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const doSend = async (messageText) => {
    const trimmed = messageText.trim()
    if (!trimmed || loading) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', content: trimmed, time: now }])
    setInput('')
    setLoading(true)

    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/chatbot/demand-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          query: trimmed,
          user_id: user?.id,
          user_role: profile?.role || 'buyer',
          context: {}
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Chatbot error')

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        data: data.data,
        suggestions: data.suggestions,
        time: replyTime
      }])
    } catch (err) {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ I couldn't get that data right now. Try asking: "Tomato price in Bangalore" or "Onion market trend".`,
        time: replyTime
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => doSend(input)

  const handleSuggestionClick = (query) => {
    doSend(query)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-2xl p-4 mb-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-black text-white">Demand Forecast Assistant</h2>
            <p className="text-emerald-200 text-xs">Live APMC prices • Market trends • Buying advice</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-400/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-200 text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
              msg.role === 'user' 
                ? 'bg-emerald-600' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}>
              {msg.role === 'user' 
                ? <User className="w-4 h-4 text-white" />
                : <Bot className="w-4 h-4 text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
              }`}>
                <p dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />

                {/* Inline market data */}
                {msg.data && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-gray-700">
                    <div className="flex items-center gap-1 mb-2 text-emerald-700 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Market Data
                    </div>
                    <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {!loading && messages.length <= 2 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-medium transition-all hover:border-emerald-400"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Latest assistant suggestions */}
      {!loading && messages[messages.length - 1]?.suggestions?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Follow-up questions:</p>
          <div className="flex flex-wrap gap-2">
            {messages[messages.length - 1].suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-medium transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-end gap-3 p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about crop prices, market trends..."
            className="flex-1 text-sm resize-none bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 min-h-[40px] max-h-32 py-2"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0"
          >
            {loading 
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-[10px] text-gray-400 px-4 pb-2 text-center">
          Enter to send • Powered by AgriMart AI + Live APMC Data
        </p>
      </div>
    </div>
  )
}