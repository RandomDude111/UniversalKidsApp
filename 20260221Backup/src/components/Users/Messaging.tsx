import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface User {
  id: string;
  name: string;
  email: string;
  class?: string;
  role?: string;
  status?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  timestamp: Timestamp;
}

interface MessagingProps {
  recipient: User;
  currentUser: { uid: string; email: string };
  onBack: () => void;
}

export const Messaging = ({ recipient, currentUser, onBack }: MessagingProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages between current user and recipient
  useEffect(() => {
    if (!currentUser.uid || !recipient.id) return;

    const messagesCollection = collection(db, 'messages');
    
    // Query for messages between these two users (both directions)
    const q = query(
      messagesCollection,
      where('conversationId', '==', [currentUser.uid, recipient.id].sort().join('-'))
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<Message, 'id'>
          }))
          .sort((a, b) => {
            const timeA = a.timestamp?.toMillis?.() ?? 0;
            const timeB = b.timestamp?.toMillis?.() ?? 0;
            return timeA - timeB;
          });
        setMessages(msgs);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser.uid, recipient.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    try {
      const conversationId = [currentUser.uid, recipient.id].sort().join('-');
      
      await addDoc(collection(db, 'messages'), {
        conversationId,
        senderId: currentUser.uid,
        senderName: currentUser.email.split('@')[0],
        recipientId: recipient.id,
        text: messageText.trim(),
        timestamp: Timestamp.now(),
        read: false
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-white">{recipient.name}</h1>
          <p className="text-gray-400 text-xs">{recipient.email}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs text-gray-300 mb-1 font-semibold">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp?.toDate().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-gray-900 border-t border-gray-700 p-4 flex gap-3"
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!messageText.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
