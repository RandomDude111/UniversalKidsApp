import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LockScreen } from './components/LockScreen';
import { NotificationPanel } from './components/NotificationPanel';
import { HomeScreen } from './components/HomeScreen';
import { AppLauncher } from './components/AppLauncher';
import { App as AppType } from './data/apps';
import { ArrowLeft } from 'lucide-react';

interface UserData {
  email: string;
  name: string;
  balance: number;
  role: string;
  class: string;
  status: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  read: boolean;
  timestamp: any;
}

function App() {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState<AppType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [selectedMessageSender, setSelectedMessageSender] = useState<{ id: string; name: string } | null>(null);

  // Group messages by sender - only show latest message per sender
  const notifications = messages.reduce((acc, msg) => {
    if (!acc[msg.senderId]) {
      acc[msg.senderId] = msg;
    }
    return acc;
  }, {} as Record<string, Message>);

  const notificationList = Object.values(notifications);

  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || ''
        });

        // Fetch user data from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserData;
            setUserData(data);
            setBankBalance(data.balance || 0);
            console.log('📊 User data loaded:', data);
          } else {
            console.log('❌ No user document found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        // Listen for incoming unread messages for this user
        const messagesCollection = collection(db, 'messages');
        const q = query(
          messagesCollection,
          where('recipientId', '==', currentUser.uid),
          where('read', '==', false)
        );

        unsubscribeMessages = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<Message, 'id'>
          }));
          setMessages(msgs);
        }, (error) => {
          console.error('Error fetching messages:', error);
        });
      } else {
        setUser(null);
        setMessages([]);
        if (unsubscribeMessages) {
          unsubscribeMessages();
          unsubscribeMessages = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, []);

  const markMessagesAsRead = async (senderId: string) => {
    try {
      const messagesCollection = collection(db, 'messages');
      const q = query(
        messagesCollection,
        where('senderId', '==', senderId),
        where('recipientId', '==', user?.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(async (doc) => {
        await updateDoc(doc.ref, { read: true });
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleFullscreenToggle = () => {
    if (document.documentElement.requestFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentApp(null);
    setNotificationPanelOpen(false);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <LockScreen
        onAuthenticated={(uid: string, email: string) => setUser({ uid, email })}
        onFullscreenToggle={handleFullscreenToggle}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* Notification Panel - Always on top */}
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(!notificationPanelOpen)}
        onLogout={handleLogout}
        messages={notificationList}
        bankBalance={bankBalance}
        studentName={userData?.name}
        onFullscreenToggle={handleFullscreenToggle}
        onMessageClick={(senderId: string, senderName: string) => {
          markMessagesAsRead(senderId);
          setSelectedMessageSender({ id: senderId, name: senderName });
          const usersApp = { id: 'users', name: 'Users', icon: null, color: 'bg-teal-500' } as AppType;
          setCurrentApp(usersApp);
          setNotificationPanelOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {currentApp ? (
          <div className="w-full h-full flex flex-col bg-black">
            {/* App Header */}
            <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setCurrentApp(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Go back to home"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <h1 className="text-lg font-semibold text-white flex-1 text-center">
                {currentApp.name}
              </h1>
              <div className="w-10" />
            </div>

            {/* App Content */}
            <div className="flex-1 overflow-y-auto">
              <AppLauncher 
                app={currentApp} 
                onClose={() => {
                  setCurrentApp(null);
                  setSelectedMessageSender(null);
                }}
                preSelectedSender={selectedMessageSender}
                onOpenApp={(app) => setCurrentApp(app)}
              />
            </div>
          </div>
        ) : (
          <HomeScreen onOpenApp={setCurrentApp} />
        )}
      </div>

      {/* Home Button - Always at bottom */}
      <button
        onClick={() => setCurrentApp(null)}
        className="h-16 bg-gray-900 border-t border-gray-700 w-full text-white font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        Home
      </button>
    </div>
  );
}

export default App;
