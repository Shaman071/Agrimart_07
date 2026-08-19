// DemandChatbot - Buyer's demand forecast chatbot
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, Send, Mic, Bot, User, Zap, TrendingUp, TrendingDown, Minus, Plus, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SAMPLE_QUERIES = [
  "Tomato price in Bangalore",
  "Onion arrivals in Mysore",
  "Price trend for Potato",
  "Best time to buy Rice",
  "Market forecast next week",
  "Cheapest vegetables near me",
]

export default function DemandChatbot() {
  const { t } = useTranslation('common')
  const { profile, user } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AgriMart demand forecast assistant. Ask me about crop prices, market trends, arrivals, or buying advice." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchSampleQueries()
    scrollToBottom()
  }, [messages])

  const fetchSampleQueries = async () => {
    // Could fetch from backend /chatbot/sample-queries
    setSuggestions(SAMPLE_QUERIES)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`${API_BASE}/chatbot/demand-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          query: userMessage,
          user_id: user.id,
          user_role: profile?.role || 'buyer',
          context: {}
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Chatbot error')

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        data: data.data,
        suggestions: data.suggestions
      }])
      if (data.suggestions) setSuggestions(data.suggestions)
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err.message}` 
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (query) => {
    setInput(query)
    sendMessage()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Demand Forecast Assistant</h2>
            <p className="text-sm text-gray-500">Ask about prices, trends, arrivals, and buying strategies</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-2xl rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'}`}>
              <div className="p-4">
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.data && (
                  <div className="mt-2 p-2 bg-white/50 rounded-lg text-xs">
                    <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md p-4 animate-pulse">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full" style={{animationDelay: '0ms'}} />
                <div className="w-2 h-2 bg-gray-400 rounded-full" style={{animationDelay: '150ms'}} />
                <div className="w-2 h-2 bg-gray-400 rounded-full" style={{animationDelay: '300ms'}} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="card">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about prices, trends, arrivals..."
            className="flex-1 input-field min-h-[48px] max-h-32 resize-none"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="btn-primary h-10 px-6 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Shift+Enter for new line • Enter to send
        </p>
      </div>
    </div>
  )
}