import { useState, useRef, useEffect } from 'react'
import './ChatBot.css'
import logoDelasalle from '../assets/logo-delasalle.png'

const API_URL = 'http://localhost:8000'

function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Halo! 👋 Saya adalah Chatbot PMB Universitas Katolik De La Salle Manado. Ada yang bisa saya bantu tentang PMB?'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const message = inputValue.trim()
    
    if (!message || isLoading) return

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })

      const data = await response.json()
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.reply,
        intent: data.intent,
        confidence: data.confidence
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.',
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const suggestedQuestions = [
    'Apa itu PMB?',
    'Jadwal pendaftaran',
    'Biaya pendaftaran',
    'Persyaratan',
  ]

  const handleSuggestionClick = (question) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <div className="header-avatar">
          <img src={logoDelasalle} alt="De La Salle Logo" />
        </div>
        <div className="header-info">
          <h1>Chatbot PMB</h1>
          <p>UK De La Salle Manado</p>
        </div>
        <div className="header-status">
          <span className="status-dot"></span>
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}
          >
            {msg.type === 'bot' && (
              <div className="message-avatar">
                <img src={logoDelasalle} alt="Bot" />
              </div>
            )}
            <div className="message-content">
              <p>{msg.text}</p>
              {msg.intent && (
                <span className="message-meta">
                  {msg.intent} • {Math.round((msg.confidence || 0) * 100)}%
                </span>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot loading">
            <div className="message-avatar">
              <img src={logoDelasalle} alt="Bot" />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="suggestions">
          <p>Pertanyaan populer:</p>
          <div className="suggestion-chips">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form className="chatbot-input" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ketik pertanyaan Anda..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default ChatBot
