import { useEffect, useState, useRef } from 'react'
import { db } from '../firebase'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

// Avatar component
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp?: any
}

export function TeamChat({
  teamId,
  currentUserId,
  currentUserName,
}: {
  teamId: string
  currentUserId: string
  currentUserName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Load messages in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'teams', teamId, 'messages'),
      orderBy('timestamp'),
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })),
      )
    })
    return unsubscribe
  }, [teamId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await addDoc(collection(db, 'teams', teamId, 'messages'), {
      senderId: currentUserId,
      senderName: currentUserName,
      text: newMessage,
      timestamp: serverTimestamp(),
    })
    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-96 border border-border/10 rounded-lg p-4 overflow-y-auto bg-accent dark:bg-muted">
      {/* Messages */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 max-w-[70%] ${
              msg.senderId === currentUserId ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{msg.senderName?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div
              className={`p-2 rounded-lg break-words font-quantico ${
                msg.senderId === currentUserId
                  ? 'bg-primary text-primary-foreground text-sm'
                  : 'bg-muted text-muted-foreground text-sm'
              }`}
            >
              <p className="font-semibold">{msg.senderName}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 p-2 border border-border rounded bg-background text-foreground dark:bg-card dark:text-card-foreground font-quantico"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded font-quantico"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  )
}
