import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastTimestamp: any;
}

interface InboxProps {
  onSelectConversation: (userId: string, userName: string) => void;
}

export const Inbox = ({ onSelectConversation }: InboxProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) return;

    const messagesCollection = collection(db, 'messages');
    
    // Get all messages where current user is either sender or recipient
    const q = query(
      messagesCollection,
      where('conversationId', '!=', '') // This ensures we get all messages
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();
      const userNameCache = new Map<string, string>();

      // Function to get user name from database
      const getUserName = async (userId: string): Promise<string> => {
        if (userNameCache.has(userId)) {
          return userNameCache.get(userId)!;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userName = userDoc.data().name || 'Unknown User';
            userNameCache.set(userId, userName);
            return userName;
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
        return 'Unknown User';
      };

      // Process each message
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const { senderId, recipientId, text, timestamp } = data;

        // Only include conversations involving current user
        if (senderId === currentUser.uid) {
          // Current user is sender, other person is recipient
          const otherUserId = recipientId;
          const otherUserName = await getUserName(otherUserId);

          const existing = conversationMap.get(otherUserId);
          if (!existing || timestamp?.toMillis?.() > (existing.lastTimestamp?.toMillis?.() ?? 0)) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              userName: otherUserName,
              lastMessage: text,
              lastTimestamp: timestamp,
            });
          }
        } else if (recipientId === currentUser.uid) {
          // Current user is recipient, other person is sender
          const otherUserId = senderId;
          const otherUserName = await getUserName(otherUserId);

          const existing = conversationMap.get(otherUserId);
          if (!existing || timestamp?.toMillis?.() > (existing.lastTimestamp?.toMillis?.() ?? 0)) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              userName: otherUserName,
              lastMessage: text,
              lastTimestamp: timestamp,
            });
          }
        }
      }

      // Sort by most recent
      const sorted = Array.from(conversationMap.values()).sort(
        (a, b) => (b.lastTimestamp?.toMillis?.() ?? 0) - (a.lastTimestamp?.toMillis?.() ?? 0)
      );

      setConversations(sorted);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-4">
        <h2 className="text-2xl font-bold text-white">Inbox</h2>
        <p className="text-gray-400 text-sm mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => onSelectConversation(conv.userId, conv.userName)}
                className="w-full p-4 hover:bg-gray-900 transition-colors text-left border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.userName.charAt(0).toUpperCase()}
                  </div>

                  {/* Message Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="text-white font-semibold">{conv.userName}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {conv.lastTimestamp?.toDate?.().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate mt-1">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
