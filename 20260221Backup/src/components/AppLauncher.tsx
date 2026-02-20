import { useState, useEffect } from 'react';
import { App } from '../data/apps';
import { UsersList } from './Users/UsersList';
import { UserProfile } from './Users/UserProfile';
import { Messaging } from './Users/Messaging';
import { Inbox } from './Inbox';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc, deleteDoc, writeBatch, getDoc, runTransaction } from 'firebase/firestore';
import EnglishTicTacToe from './EnglishTicTacToe';
import WordRunner from './WordRunner';
import Handgrabber from './Handgrabber';
import MinecraftGame from './Minecraft/MinecraftGame';
import { StudentHomework } from './Homework/StudentHomework';
import { TeacherHomework } from './Homework/TeacherHomework';
import { APPS } from '../data/apps';

interface AppLauncherProps {
  app: App;
  onClose: () => void;
  preSelectedSender?: { id: string; name: string } | null;
  onOpenApp?: (app: App) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  class?: string;
  role?: string;
  status?: string;
}

// Placeholder components for each app
const ProfileApp = ({ currentUser }: { currentUser: any }) => {
  const uid = currentUser?.uid;
  const [profile, setProfile] = useState<any>({
    name: '',
    email: currentUser?.email || '',
    birthday: '',
    intro: '',
    bankBalance: 0,
    closeFriends: [] as string[],
  });
  const [editing, setEditing] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(db, 'users', uid);
    getDoc(userRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setProfile((prev: any) => ({ ...prev, ...data }));
      }
    }).catch(err => console.error('fetch profile err', err));

    // fetch users for close friends dropdown
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const snap = await getDocs(usersCol);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setAllUsers(list.filter(u => u.id !== uid));
      } catch (e) { console.error(e); }
    };
    fetchUsers();
  }, [uid]);

  const computeAge = (bday?: string) => {
    if (!bday) return '';
    const d = new Date(bday);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return String(age);
  };

  const saveProfile = async () => {
    if (!uid) return alert('Not signed in');
    try {
      await setDoc(doc(db, 'users', uid), profile, { merge: true });
      setEditing(false);
      alert('Profile saved');
    } catch (err) {
      console.error('save profile err', err);
      alert('Failed to save profile');
    }
  };

  return (
    <div className="w-full h-full p-6 bg-black">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={saveProfile} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col items-center">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4">
            {profile.name ? profile.name.charAt(0).toUpperCase() : (currentUser?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="text-white font-semibold text-lg">{profile.name || '—'}</div>
          <div className="text-gray-400 text-sm">{profile.email}</div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <p className="text-sm text-gray-400">Birthday</p>
            {editing ? (
              <input type="date" value={profile.birthday || ''} onChange={e => setProfile({...profile, birthday: e.target.value})} className="w-full p-2 bg-gray-800 text-white rounded mt-2" />
            ) : (
              <p className="text-white">{profile.birthday || '—'}</p>
            )}
          </div>

          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <p className="text-sm text-gray-400">Age</p>
            <p className="text-white">{computeAge(profile.birthday) || '—'}</p>
          </div>

          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <p className="text-sm text-gray-400">Profile Introduction</p>
            {editing ? (
              <textarea value={profile.intro || ''} onChange={e => setProfile({...profile, intro: e.target.value})} className="w-full p-2 bg-gray-800 text-white rounded mt-2" rows={4} />
            ) : (
              <p className="text-white">{profile.intro || '—'}</p>
            )}
          </div>

          <div className="bg-gray-900 p-4 rounded border border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Bank Balance</p>
              <p className="text-white text-lg font-semibold">${Number(profile.bankBalance || 0).toFixed(2)}</p>
            </div>
            {editing && (
              <input type="number" value={profile.bankBalance || 0} onChange={e => setProfile({...profile, bankBalance: Number(e.target.value)})} className="p-2 bg-gray-800 text-white rounded" />
            )}
          </div>

          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <p className="text-sm text-gray-400">Close Friends</p>
            {editing ? (
              <select multiple value={profile.closeFriends || []} onChange={e => {
                const options = Array.from(e.target.options).filter(o => o.selected).map(o => o.value);
                setProfile({...profile, closeFriends: options});
              }} className="w-full p-2 bg-gray-800 text-white rounded mt-2">
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {(profile.closeFriends || []).map((fid: string) => {
                  const f = allUsers.find(u => u.id === fid);
                  return (
                    <div key={fid} className="px-3 py-1 bg-gray-800 rounded text-white text-sm">{f ? f.name : fid}</div>
                  );
                })}
                {(profile.closeFriends || []).length === 0 && <div className="text-gray-500">No close friends set</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const TicTacToeApp = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isBoardFull = board.every(square => square !== null);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Tic-Tac-Toe</h2>
      <div className="flex justify-center">
        <div className="inline-block">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex">
              {[0, 1, 2].map((col) => (
                <button
                  key={row * 3 + col}
                  onClick={() => handleClick(row * 3 + col)}
                  className="w-20 h-20 bg-gray-800 border-2 border-gray-600 text-white text-3xl font-bold hover:bg-gray-700 transition-colors"
                >
                  {board[row * 3 + col]}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="text-center">
        {winner ? (
          <p className="text-xl font-bold text-green-400">Player {winner} wins!</p>
        ) : isBoardFull ? (
          <p className="text-xl font-bold text-yellow-400">It's a draw!</p>
        ) : (
          <p className="text-xl text-gray-300">Player {isXNext ? 'X' : 'O'}'s turn</p>
        )}
      </div>
      <button
        onClick={resetGame}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        New Game
      </button>
    </div>
  );
};

const InboxApp = ({ currentUser }: { currentUser: { uid: string; email: string } | null, onSelectConversation?: (userId: string, userName: string) => void }) => {
  const [selectedConversation, setSelectedConversation] = useState<{ userId: string; userName: string } | null>(null);

  if (selectedConversation && currentUser) {
    return (
      <Messaging
        recipient={{
          id: selectedConversation.userId,
          name: selectedConversation.userName,
          email: ''
        }}
        currentUser={currentUser}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <Inbox
      onSelectConversation={(userId, userName) => setSelectedConversation({ userId, userName })}
    />
  );
};

const CalendarApp = ({ currentUser }: { currentUser: any }) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch schedules from database for current student
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchSchedules = async () => {
      try {
        const schedulesCollection = collection(db, 'schedules');
        const q = query(schedulesCollection, where('studentId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const scheduleList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ScheduleItem[];
        setSchedules(scheduleList);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">📅 My Schedule</h2>
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">📅 My Schedule</h2>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header with days */}
          <div className="grid gap-2" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}>
            <div className="w-24 p-2 text-center text-gray-400 text-xs">Time Slot</div>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} className="w-32 p-2 text-center font-semibold text-white bg-gray-700 rounded">
                {day}
              </div>
            ))}

            {/* Row 1 - 4:00 PM */}
            <div className="w-24 p-2 text-center text-sm text-gray-300 font-semibold">4:00 PM</div>
            {[0, 1, 2, 3, 4].map(dayIndex => {
              const scheduled = schedules.find(s => s.dayIndex === dayIndex && s.slotIndex === 0);
              return (
                <div
                  key={`0-${dayIndex}`}
                  className="w-32 h-20 p-2 border-2 border-dashed border-gray-600 rounded bg-gray-900 flex items-center justify-center"
                >
                  {scheduled ? (
                    <div className="w-full h-full bg-green-600 rounded flex items-center justify-center text-white font-semibold text-sm text-center px-2">
                      {scheduled.lessonName}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </div>
              );
            })}

            {/* Row 2 - 5:00 PM */}
            <div className="w-24 p-2 text-center text-sm text-gray-300 font-semibold">5:00 PM</div>
            {[0, 1, 2, 3, 4].map(dayIndex => {
              const scheduled = schedules.find(s => s.dayIndex === dayIndex && s.slotIndex === 1);
              return (
                <div
                  key={`1-${dayIndex}`}
                  className="w-32 h-20 p-2 border-2 border-dashed border-gray-600 rounded bg-gray-900 flex items-center justify-center"
                >
                  {scheduled ? (
                    <div className="w-full h-full bg-purple-600 rounded flex items-center justify-center text-white font-semibold text-sm text-center px-2">
                      {scheduled.lessonName}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Summary */}
      {schedules.length === 0 && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-center text-gray-400">
          No schedule assigned yet.
        </div>
      )}
    </div>
  );
};

const TEACHER_CODE = '1234';

const BankApp = ({ currentUser }: { currentUser: any }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [enteredCode, setEnteredCode] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [amount, setAmount] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setBalance(data.balance || 0);
      } else {
        setBalance(0);
      }
      setLoading(false);
    }, (err) => {
      console.error('Bank listener error', err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const addCodeDigit = (digit: string) => {
    if (enteredCode.length < 4) {
      setEnteredCode(enteredCode + digit);
    }
  };

  const clearCode = () => {
    setEnteredCode('');
  };

  const verifyTeacher = () => {
    if (enteredCode === TEACHER_CODE) {
      setIsTeacher(true);
      setEnteredCode('');
    } else {
      alert('Invalid teacher code');
      setEnteredCode('');
    }
  };

  const adjustBalance = async (delta: number) => {
    if (!currentUser) return alert('Not signed in');
    const ref = doc(db, 'users', currentUser.uid);
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return alert('Enter a valid amount');
    setAdjusting(true);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('User doc missing');
        const cur = (snap.data() as any).balance || 0;
        const next = Math.max(0, cur + delta * parsed);
        tx.update(ref, { balance: next });
      });
      setAmount('');
    } catch (err) {
      console.error('Adjust error', err);
      alert('Failed to update balance');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Bank</h2>

      <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl text-white mb-6">
        <div className="text-sm text-purple-200 mb-2">Account Balance</div>
        <div className="text-4xl font-bold">{loading ? 'Loading...' : `$${(balance||0).toFixed(2)}`}</div>
      </div>

      {!isTeacher ? (
        <div className="space-y-3 bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-4">Teacher Unlock (Enter code)</div>
          <div className="bg-gray-900 p-3 rounded text-center text-white text-2xl tracking-widest mb-4 h-12 flex items-center justify-center">
            {enteredCode.split('').map((_, i) => <span key={i}>●</span>).length > 0 ? enteredCode.split('').map((_, i) => <span key={i}>●</span>) : <span className="text-gray-600">----</span>}
          </div>
          <div className="flex justify-center mb-3">
            <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => addCodeDigit(num.toString())}
                  disabled={enteredCode.length >= 4}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-xl font-bold rounded-lg transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={clearCode} className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Clear</button>
            <button onClick={verifyTeacher} disabled={enteredCode.length !== 4} className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg">Submit</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-3">Adjust Balance</div>
            <div className="bg-gray-900 p-3 rounded text-right text-white text-3xl font-bold mb-3 h-14 flex items-center justify-end px-4">
              ${amount || '0'}
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-0 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => setAmount(amount + num.toString())}
                    className="w-[150px] h-[150px] bg-blue-600 hover:bg-blue-700 text-white text-5xl font-bold rounded-none transition-colors flex items-center justify-center border border-blue-800"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-0 mb-3">
                <button
                  onClick={() => setAmount(amount + '0')}
                  className="w-[150px] h-[150px] bg-blue-600 hover:bg-blue-700 text-white text-5xl font-bold rounded-none transition-colors flex items-center justify-center border border-blue-800"
                >
                  0
                </button>
                <button
                  onClick={() => setAmount(amount.includes('.') ? amount : (amount + '.'))}
                  className="w-[150px] h-[150px] bg-blue-600 hover:bg-blue-700 text-white text-5xl font-bold rounded-none transition-colors flex items-center justify-center border border-blue-800"
                >
                  .
                </button>
                <button
                  onClick={() => setAmount(amount.slice(0, -1))}
                  className="w-[150px] h-[150px] bg-yellow-600 hover:bg-yellow-700 text-white text-xl font-bold rounded-none transition-colors flex items-center justify-center border border-yellow-700"
                >
                  ← Back
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAmount('')} className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold">Clear</button>
              <button onClick={() => adjustBalance(1)} disabled={adjusting || !amount} className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold">Add Funds</button>
              <button onClick={() => adjustBalance(-1)} disabled={adjusting || !amount} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg font-semibold">Remove Funds</button>
            </div>
            <button onClick={() => setIsTeacher(false)} className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Lock</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="font-semibold text-white">Recent Transaction</div>
          <div className="text-sm text-gray-400 mt-1">(Live data reflects database updates)</div>
        </div>
      </div>
    </div>
  );
};

const LibraryApp = () => (
  <div className="p-6 space-y-4">
    <h2 className="text-2xl font-bold text-white mb-6">Library</h2>
    <div className="space-y-3">
      {['Math Textbook', 'English Reader', 'Science Lab Manual'].map((book, i) => (
        <div key={i} className="bg-gray-800 p-4 rounded-lg">
          <div className="font-semibold text-white">{book}</div>
          <div className="text-sm text-gray-400 mt-1">Available in Library</div>
        </div>
      ))}
    </div>
  </div>
);



const LiveApp = ({ onOpenApp }: { onOpenApp?: (app: App) => void }) => {
  const [session, setSession] = useState<any>(null);
  const [screenFrame, setScreenFrame] = useState<string | null>(null);

  // Listen to live session updates
  useEffect(() => {
    const ref = doc(db, 'liveSessions', 'current');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSession(data);
        // Update screenFrame immediately when session changes
        if (data.screenFrameUrl) {
          setScreenFrame(data.screenFrameUrl);
        }
      }
      else setSession(null);
    }, (err) => {
      console.error('live session listen error', err);
    });
    return () => unsub();
  }, []);

  // Reload screen frame every second when teacher is sharing
  useEffect(() => {
    if (!session || !session.active || session.type !== 'screen') {
      return;
    }

    console.log('Starting screen frame reload for screen share');
    
    let isRunning = true;

    const reloadFrame = async () => {
      if (!isRunning) return;

      try {
        const ref = doc(db, 'liveSessions', 'current');
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const sessionData = snap.data();
          if (sessionData.screenFrameUrl) {
            console.log('Screen frame reloaded');
            // Set the frame directly (data URLs change with new content)
            setScreenFrame(sessionData.screenFrameUrl);
          }
        }
      } catch (err) {
        console.error('Frame reload error:', err);
      }

      // Reload again in 1 second
      if (isRunning) {
        setTimeout(reloadFrame, 1000);
      }
    };

    reloadFrame();

    return () => {
      console.log('Stopping frame reload');
      isRunning = false;
    };
  }, [session]);

  // Auto-open games
  useEffect(() => {
    if (!session || !session.active) return;
    if (session.type === 'game' && onOpenApp && session.payload) {
      const app = APPS.find(a => a.id === session.payload);
      if (app) {
        onOpenApp(app);
      }
    }
  }, [session, onOpenApp]);

  const renderContent = () => {
    if (!session || !session.active) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-gray-300">No live content right now</div>
        </div>
      );
    }

    const { type, payload, meta } = session;

    if (type === 'link') {
      const blockedDomains = ['canva.com', 'youtube.com', 'youtu.be', 'vimeo.com'];
      const isBlocked = blockedDomains.some(d => payload.includes(d));
      
      if (isBlocked) {
        return (
          <div className="space-y-4 text-center">
            <div className="text-sm text-gray-400">{meta?.title || 'Link'}</div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="text-white mb-4">This content cannot be embedded directly.</div>
              <a href={payload} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Open in New Tab →
              </a>
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">{meta?.title || 'Live Link'}</div>
          <div className="w-full h-[600px] bg-black">
            <iframe src={payload} className="w-full h-full" />
          </div>
        </div>
      );
    }

    if (type === 'pdf') {
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">{meta?.title || 'PDF'}</div>
          <div className="w-full h-[700px] bg-black">
            <iframe src={payload} className="w-full h-full" />
          </div>
        </div>
      );
    }

    if (type === 'video') {
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">{meta?.title || 'Video'}</div>
          <div className="w-full h-[500px] bg-black flex items-center justify-center">
            <iframe 
              src={payload} 
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    if (type === 'game') {
      return (
        <div className="space-y-2 text-center">
          <div className="text-sm text-gray-400">{meta?.title || 'Open Game'}</div>
          <div className="text-white">App ID: {payload}</div>
          <div className="text-gray-400 text-sm">Students can open this app from their launcher.</div>
        </div>
      );
    }

    if (type === 'screen') {
      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">{meta?.title || 'Screen Share'}</div>
          <div className="w-full bg-black rounded-lg overflow-hidden">
            {screenFrame ? (
              <img 
                src={screenFrame} 
                alt="Screen share"
                className="w-full h-auto"
                style={{ maxHeight: '600px', display: 'block' }}
              />
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center text-gray-400">
                Waiting for screen frames...
              </div>
            )}
          </div>
        </div>
      );
    }

    return <div className="text-gray-300">Unsupported live type</div>;
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-2">Live</h2>
      {session && session.active ? (
        <div className="text-sm text-green-400">● LIVE — {session.meta?.title || ''}</div>
      ) : (
        <div className="text-sm text-gray-400">No active broadcast</div>
      )}

      {renderContent()}
    </div>
  );
};

interface ClassInfo {
  id: string;
  name: string;
  days: string[];
  teacher: string;
  course: string;
  students?: string[];
}

interface ScheduleItem {
  id: string;
  studentId: string;
  lessonName: string;
  dayIndex: number; // 0-4 for Mon-Fri
  slotIndex: number; // 0-1 for slot 1-2
  time: string;
}

const TeacherApp = ({ currentUser }: { currentUser: any }) => {
  const [entered, setEntered] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<'live' | 'students' | 'funds' | 'classes' | 'scheduling' | 'jointgames' | 'homework' | null>(null);

  const [liveType, setLiveType] = useState<'link'|'pdf'|'video'|'game'|'screen'>('link');
  const [payload, setPayload] = useState('');
  const [title, setTitle] = useState('');
  
  // Classes state
  const [classes, setClasses] = useState<ClassInfo[]>([]);

  // Fetch classes from database on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesCollection = collection(db, 'classes');
        const snapshot = await getDocs(classesCollection);
        const classList = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.name,
            days: data.days || [],
            teacher: data.teacher || '',
            course: data.course || data.grade || '',
            students: data.students || []
          } as ClassInfo;
        }) as ClassInfo[];
        setClasses(classList);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Classes form state
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [formData, setFormData] = useState({ name: '', days: [] as string[], teacher: '', course: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Scheduling state
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);

  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const studentList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown'
        }));
        setStudents(studentList);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const [draggedLesson, setDraggedLesson] = useState<{ lessonName: string; source?: 'palette' } | null>(null);

  // Fetch schedules from database
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const schedulesCollection = collection(db, 'schedules');
        const snapshot = await getDocs(schedulesCollection);
        const scheduleList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ScheduleItem[];
        setSchedules(scheduleList);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      }
    };
    fetchSchedules();
  }, []);

  // Save schedules to database whenever they change
  const saveScheduleToDatabase = async (schedule: ScheduleItem) => {
    try {
      await setDoc(doc(db, 'schedules', schedule.id), schedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  // Handle class form operations
  const resetClassForm = () => {
    setFormData({ name: '', days: [], teacher: '', course: '' });
    setEditingClass(null);
    setShowAddForm(false);
  };

  const handleAddClass = () => {
    if (!formData.name || !formData.teacher || !formData.course || formData.days.length === 0) {
      alert('Please fill all fields and select at least one day');
      return;
    }
    const newClass: ClassInfo = {
      id: Date.now().toString(),
      ...formData
    };
    // Save to database
    setDoc(doc(db, 'classes', newClass.id), newClass).catch(err => {
      console.error('Error adding class:', err);
      alert('Failed to save class');
    });
    setClasses([...classes, newClass]);
    resetClassForm();
  };

  const handleEditClass = (cls: ClassInfo) => {
    setEditingClass(cls);
    setFormData({ name: cls.name, days: cls.days, teacher: cls.teacher, course: cls.course });
    setShowAddForm(false);
  };

  const handleUpdateClass = () => {
    if (!formData.name || !formData.teacher || !formData.course || formData.days.length === 0) {
      alert('Please fill all fields and select at least one day');
      return;
    }
    if (!editingClass) return;
    const updatedClass = { ...editingClass, ...formData };
    // Update in database
    setDoc(doc(db, 'classes', editingClass.id), updatedClass).catch(err => {
      console.error('Error updating class:', err);
      alert('Failed to update class');
    });
    setClasses(classes.map(c => c.id === editingClass.id ? updatedClass : c));
    resetClassForm();
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      // Delete from database
      deleteDoc(doc(db, 'classes', id)).catch(err => {
        console.error('Error deleting class:', err);
        alert('Failed to delete class');
      });
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const addDigit = (d: string) => { if (entered.length < 4) setEntered(entered + d); };
  const clear = () => setEntered('');
  const submitCode = () => { if (entered === TEACHER_CODE) { setUnlocked(true); setEntered(''); } else { alert('Invalid'); setEntered(''); } };

  const publishLive = async () => {
    try {
      const ref = doc(db, 'liveSessions', 'current');
      await setDoc(ref, {
        active: true,
        type: liveType,
        payload: payload,
        meta: { title, startedBy: currentUser?.uid || 'teacher', timestamp: serverTimestamp() }
      });
      alert('Published');
    } catch (err) {
      console.error(err);
      alert('Failed to publish');
    }
  };

  const stopLive = async () => {
    try {
      const ref = doc(db, 'liveSessions', 'current');
      await setDoc(ref, { active: false }, { merge: true });
      setPayload('');
      setTitle('');
      alert('Stopped');
    } catch (err) {
      console.error(err);
      alert('Failed to stop');
    }
  };

  const shareScreen = async () => {
    try {
      // Get user's screen
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false
      });

      // Create canvas to capture frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const video = document.createElement('video');
      video.srcObject = screenStream;
      video.play();

      // Wait for video to load
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('Canvas size:', canvas.width, 'x', canvas.height);

      // Start session
      const ref = doc(db, 'liveSessions', 'current');
      await setDoc(ref, {
        active: true,
        type: 'screen',
        payload: 'canvas-streaming',
        screenFrameUrl: null, // Will be updated with image data URL
        meta: { title: 'Screen Share', startedBy: currentUser?.uid || 'teacher', timestamp: serverTimestamp() }
      });

      alert('Screen sharing started');
      console.log('Screen sharing started, beginning frame capture');

      let frameCount = 0;
      let lastUpdateTime = 0;
      const updateInterval = 1000; // 1 second
      
      const captureFrame = async () => {
        try {
          if (screenStream.getTracks()[0].readyState !== 'live') {
            console.log('Screen stream ended, stopping capture');
            stopLive();
            return;
          }

          const now = Date.now();
          if (now - lastUpdateTime >= updateInterval) {
            lastUpdateTime = now;

            ctx.drawImage(video, 0, 0);
            const frameData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
            
            // Update Firestore with the base64 JPG data
            await setDoc(ref, {
              screenFrameUrl: frameData,
              lastUpdate: Date.now()
            }, { merge: true });

            frameCount++;
            console.log('Frame updated:', frameCount);
          }
        } catch (err) {
          console.error('Frame capture error:', err);
        }

        requestAnimationFrame(captureFrame);
      };

      captureFrame();

      // Handle stop
      screenStream.getTracks()[0].onended = () => {
        video.pause();
        stopLive();
      };
    } catch (err) {
      console.error('Screen share error:', err);
      alert('Failed to share screen: ' + (err as any).message);
    }
  };

  if (!unlocked) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Teacher Login</h2>
        <div className="bg-gray-900 p-3 rounded text-center text-white text-2xl tracking-widest mb-4 h-12 flex items-center justify-center">
          {entered.split('').map((_,i) => <span key={i}>●</span>)}{entered.length===0 && <span className="text-gray-600">----</span>}
        </div>
        <div className="flex justify-center mb-3">
          <div className="grid grid-cols-3 gap-2 w-fit">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} onClick={() => addDigit(String(n))} className="w-16 py-3 bg-blue-600 text-white rounded">{n}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-center max-w-xs mx-auto">
          <button onClick={clear} className="flex-1 py-2 bg-gray-600 text-white rounded">Clear</button>
          <button onClick={submitCode} disabled={entered.length!==4} className="flex-1 py-2 bg-green-600 text-white rounded">Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Teacher Console</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setTab('live')} className={`px-4 py-2 rounded ${tab === 'live' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}>Live</button>
        <button onClick={() => setTab('students')} className={`px-4 py-2 rounded ${tab === 'students' ? 'bg-blue-600' : 'bg-gray-600'} text-white`}>Students</button>
        <button onClick={() => setTab('funds')} className={`px-4 py-2 rounded ${tab === 'funds' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>Funds</button>
        <button onClick={() => setTab('classes')} className={`px-4 py-2 rounded ${tab === 'classes' ? 'bg-blue-600' : 'bg-green-600'} text-white`}>Classes</button>
        <button onClick={() => setTab('scheduling')} className={`px-4 py-2 rounded ${tab === 'scheduling' ? 'bg-blue-600' : 'bg-indigo-600'} text-white`}>Scheduling</button>
        <button onClick={() => setTab('jointgames')} className={`px-4 py-2 rounded ${tab === 'jointgames' ? 'bg-blue-600' : 'bg-pink-600'} text-white`}>Joint Games</button>
        <button onClick={() => setTab('homework')} className={`px-4 py-2 rounded ${tab === 'homework' ? 'bg-blue-600' : 'bg-indigo-600'} text-white`}>Homework</button>
        <button onClick={() => { setUnlocked(false); setTab(null); }} className="ml-auto px-4 py-2 bg-red-600 text-white rounded">Lock</button>
      </div>

      {tab === 'live' && (
        <div className="bg-gray-800 p-4 rounded">
          <div className="mb-2 text-sm text-gray-300">Type</div>
          <select value={liveType} onChange={(e) => setLiveType(e.target.value as any)} className="mb-3 p-2 bg-gray-900 text-white rounded w-full">
            <option value="link">Link</option>
            <option value="pdf">PDF (URL)</option>
            <option value="video">Video (YouTube embed URL)</option>
            <option value="game">Game (app id)</option>
            <option value="screen">Screen (WebRTC)</option>
          </select>
          
          {liveType !== 'screen' && (
            <>
              <div className="mb-2 text-sm text-gray-300">Title</div>
              <input className="w-full mb-3 p-2 bg-gray-900 text-white rounded" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="mb-2 text-sm text-gray-300">Payload / URL / App ID</div>
              <input 
                className="w-full mb-3 p-2 bg-gray-900 text-white rounded" 
                placeholder={liveType === 'video' ? 'Paste iframe code or YouTube embed URL' : ''} 
                value={payload} 
                onChange={(e) => {
                  let val = e.target.value;
                  // Auto-extract src from iframe code
                  if (val.includes('<iframe') && val.includes('src=')) {
                    const match = val.match(/src=["']([^"']+)["']/);
                    if (match && match[1]) val = match[1];
                  }
                  setPayload(val);
                }} 
              />
              {liveType === 'video' && <div className="text-xs text-yellow-400 mb-3">💡 Paste the full iframe code or just the embed URL — both work!</div>}
              <div className="flex gap-2">
                <button onClick={publishLive} className="flex-1 py-2 bg-green-600 text-white rounded">Publish</button>
                <button onClick={stopLive} className="flex-1 py-2 bg-red-600 text-white rounded">Stop</button>
              </div>
            </>
          )}

          {liveType === 'screen' && (
            <>
              <div className="bg-blue-900 p-4 rounded mb-4">
                <div className="text-sm text-blue-200 mb-2">📺 WebRTC Screen Sharing</div>
                <div className="text-xs text-blue-100">Your screen will be streamed to all students in real-time using WebRTC.</div>
              </div>
              <div className="flex gap-2">
                <button onClick={shareScreen} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold">Start Sharing</button>
                <button onClick={stopLive} className="flex-1 py-2 bg-red-600 text-white rounded">Stop</button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'jointgames' && (
        <div className="bg-gray-800 p-4 rounded">
          <div className="mb-3 text-sm text-gray-300">Joint Games</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 p-4 rounded text-center">
              <div className="text-white text-lg font-semibold mb-2">Hangman (Word Guess)</div>
              <div className="text-sm text-gray-400 mb-3">Create a shared room for students to join.</div>
              <CreateHangmanRoomButton currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}

      {tab === 'homework' && (
        <div className="mt-4">
          <TeacherHomework currentUser={currentUser} />
        </div>
      )}

      {tab === 'students' && (
        <div className="mt-4">
          <UsersList onSelectUser={() => {}} />
        </div>
      )}

      {tab === 'funds' && (
        <div className="mt-4">
          <BankApp currentUser={currentUser} />
        </div>
      )}

      {tab === 'classes' && (
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Classes</h3>
            {!showAddForm && !editingClass && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
              >
                + Add Class
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingClass) && (
            <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h4>
              
              {/* Class Name */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Class Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                  placeholder="e.g., Math 101"
                />
              </div>

              {/* Teacher Name */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Teacher Name</label>
                <input 
                  type="text" 
                  value={formData.teacher}
                  onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                  placeholder="e.g., Mr. Johnson"
                />
              </div>

              {/* Course */}
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Course</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Select Course --</option>
                  <option value="Active">Active</option>
                  <option value="Oak">Oak</option>
                  <option value="Willow">Willow</option>
                </select>
              </div>

              {/* Days Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-3">Days</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`py-2 px-3 rounded font-semibold text-sm transition ${
                        formData.days.includes(day)
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={editingClass ? handleUpdateClass : handleAddClass}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
                >
                  {editingClass ? 'Update' : 'Add'} Class
                </button>
                <button 
                  onClick={resetClassForm}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Classes List */}
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No classes yet. Click "+ Add Class" to create one.
              </div>
            ) : (
              classes.map(cls => (
                <div key={cls.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-lg">{cls.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">Teacher: <span className="text-blue-400">{cls.teacher}</span></p>
                      <p className="text-sm text-gray-400">Course: <span className="text-yellow-400">{cls.course}</span></p>
                      <p className="text-sm text-green-400 mt-2">📅 {cls.days.join(', ')}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleEditClass(cls)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClass(cls.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'scheduling' && (
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <h3 className="text-xl font-semibold text-white mb-4">Student Schedule</h3>
          
          {/* Student Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Select Student</label>
            <select 
              value={selectedStudent} 
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-3 bg-gray-900 text-white rounded border border-gray-700"
            >
              <option value="">-- Choose a student --</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              {/* Lesson Palette & Trash Bin */}
              <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-3">📚 Drag classes to schedule:</p>
                    {classes.length === 0 ? (
                      <p className="text-xs text-gray-500">No classes available. Create classes in the Classes tab first.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {classes.map(cls => (
                          <button
                            key={cls.id}
                            draggable
                            onDragStart={() => setDraggedLesson({ lessonName: cls.name, source: 'palette' })}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold cursor-move"
                          >
                            {cls.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Trash Bin */}
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('bg-red-700');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-red-700');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-red-700');
                      if (draggedLesson && draggedLesson.source !== 'palette') {
                        // Find and remove the dragged lesson from the schedule
                        const toRemove = schedules.find(s => s.lessonName === draggedLesson.lessonName && s.studentId === selectedStudent);
                        if (toRemove) {
                          deleteDoc(doc(db, 'schedules', toRemove.id)).catch(err => {
                            console.error('Error deleting schedule:', err);
                          });
                          setSchedules(schedules.filter(s => s.id !== toRemove.id));
                        }
                        setDraggedLesson(null);
                      }
                    }}
                    className="ml-4 w-24 h-24 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center cursor-drop border-2 border-dashed border-red-500 transition"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-1">🗑️</div>
                      <p className="text-xs text-white font-semibold">Drop to<br/>Remove</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Header with days */}
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}>
                    <div className="w-24 p-2 text-center text-gray-400 text-xs">Time Slot</div>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <div key={day} className="w-32 p-2 text-center font-semibold text-white bg-gray-700 rounded">
                        {day}
                      </div>
                    ))}

                    {/* Row 1 - 9:00 AM */}
                    <div className="w-24 p-2 text-center text-sm text-gray-300 font-semibold">9:00 AM</div>
                    {[0, 1, 2, 3, 4].map(dayIndex => {
                      const scheduled = schedules.find(s => s.studentId === selectedStudent && s.dayIndex === dayIndex && s.slotIndex === 0);
                      return (
                        <div
                          key={`0-${dayIndex}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedLesson) {
                              const newSchedule: ScheduleItem = {
                                id: Date.now().toString(),
                                studentId: selectedStudent,
                                lessonName: draggedLesson.lessonName,
                                dayIndex,
                                slotIndex: 0,
                                time: '4:00 PM'
                              };
                              const updatedSchedules = [...schedules.filter(s => !(s.studentId === selectedStudent && s.dayIndex === dayIndex && s.slotIndex === 0)), newSchedule];
                              setSchedules(updatedSchedules);
                              saveScheduleToDatabase(newSchedule);
                              setDraggedLesson(null);
                            }
                          }}
                          className="w-32 h-20 p-2 border-2 border-dashed border-gray-600 rounded bg-gray-900 flex items-center justify-center cursor-drop hover:bg-gray-800 transition"
                        >
                          {scheduled ? (
                            <div 
                              draggable
                              onDragStart={() => setDraggedLesson({ lessonName: scheduled.lessonName })}
                              className="w-full h-full bg-green-600 hover:bg-green-700 rounded flex items-center justify-center text-white font-semibold text-sm cursor-move"
                            >
                              {scheduled.lessonName}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">Drop here</span>
                          )}
                        </div>
                      );
                    })}

                    {/* Row 2 - 2:00 PM */}
                    <div className="w-24 p-2 text-center text-sm text-gray-300 font-semibold">2:00 PM</div>
                    {[0, 1, 2, 3, 4].map(dayIndex => {
                      const scheduled = schedules.find(s => s.studentId === selectedStudent && s.dayIndex === dayIndex && s.slotIndex === 1);
                      return (
                        <div
                          key={`1-${dayIndex}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedLesson) {
                              const newSchedule: ScheduleItem = {
                                id: Date.now().toString(),
                                studentId: selectedStudent,
                                lessonName: draggedLesson.lessonName,
                                dayIndex,
                                slotIndex: 1,
                                time: '5:00 PM'
                              };
                              const updatedSchedules = [...schedules.filter(s => !(s.studentId === selectedStudent && s.dayIndex === dayIndex && s.slotIndex === 1)), newSchedule];
                              setSchedules(updatedSchedules);
                              saveScheduleToDatabase(newSchedule);
                              setDraggedLesson(null);
                            }
                          }}
                          className="w-32 h-20 p-2 border-2 border-dashed border-gray-600 rounded bg-gray-900 flex items-center justify-center cursor-drop hover:bg-gray-800 transition"
                        >
                          {scheduled ? (
                            <div 
                              draggable
                              onDragStart={() => setDraggedLesson({ lessonName: scheduled.lessonName })}
                              className="w-full h-full bg-purple-600 hover:bg-purple-700 rounded flex items-center justify-center text-white font-semibold text-sm cursor-move"
                            >
                              {scheduled.lessonName}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">Drop here</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Schedule Summary */}
              <div className="mt-6 p-4 bg-gray-900 rounded">
                <p className="text-sm text-gray-300 mb-3">📅 Schedule Summary for {students.find(s => s.id === selectedStudent)?.name}:</p>
                {schedules.filter(s => s.studentId === selectedStudent).length === 0 ? (
                  <p className="text-xs text-gray-500">No lessons scheduled yet</p>
                ) : (
                  <div className="space-y-1">
                    {schedules.filter(s => s.studentId === selectedStudent).map(s => (
                      <div key={s.id} className="text-xs text-gray-300 flex justify-between">
                        <span>{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][s.dayIndex]} {s.time}:</span>
                        <span className="font-semibold">{s.lessonName}</span>
                        <button 
                          onClick={() => {
                            deleteDoc(doc(db, 'schedules', s.id)).catch(err => {
                              console.error('Error deleting schedule:', err);
                            });
                            setSchedules(schedules.filter(item => item.id !== s.id));
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- Joint Games / Hangman components ---

const CreateHangmanRoomButton = ({ currentUser }: { currentUser: any }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [roomDoc, setRoomDoc] = useState<any>(null);
  const [word, setWord] = useState('');
  const [autoReview, setAutoReview] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'hangmanRooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) setRoomDoc({ id: snap.id, ...snap.data() } as any);
      else setRoomDoc(null);
    });

    const membersCol = collection(db, 'hangmanRooms', roomId, 'members');
    const unsubMembers = onSnapshot(membersCol, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubRoom();
      unsubMembers();
    };
  }, [roomId]);

  // keep local autoReview in sync with room doc
  useEffect(() => {
    if (!roomDoc) return;
    setAutoReview(!!roomDoc.autoReview);
  }, [roomDoc]);

  // Auto-review when all have submitted and autoReview is enabled
  useEffect(() => {
    if (!roomDoc || !autoReview) return;
    if (!roomDoc.started) return;
    if (members.length === 0) return;
    const allSubmitted = members.every(m => !!m.submittedAt);
    const anyNotReviewed = members.some(m => !m.reviewed);
    if (allSubmitted && anyNotReviewed) {
      // perform review
      reviewResults();
    }
  }, [members, roomDoc, autoReview]);

  const createRoom = async () => {
    if (!currentUser) return alert('Please sign in as teacher');
    try {
      const ref = await addDoc(collection(db, 'hangmanRooms'), {
        teacherId: currentUser.uid,
        teacherName: currentUser.displayName || currentUser.email || 'Teacher',
        createdAt: serverTimestamp(),
        started: false,
        word: ''
      });
      // Publish to lobby so students auto-join
      await setDoc(doc(db, 'hangmanLobby', 'current'), { activeRoomId: ref.id }, { merge: true });
      setRoomId(ref.id);
    } catch (err) {
      console.error('createRoom err', err);
      alert('Failed to create room');
    }
  };

  const toggleStart = async (start: boolean) => {
    if (!roomId) return;
    if (start && !word) return alert('Enter the word before starting');
    // When starting a new round, clear previous member round data
    if (start) {
      const membersColRef = collection(db, 'hangmanRooms', roomId, 'members');
      try {
        const snapshot = await getDocs(membersColRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          const mRef = doc(db, 'hangmanRooms', roomId, 'members', d.id);
          batch.set(mRef, { guess: '', correct: false, reviewed: false, reviewedCorrect: false, submittedAt: null, reviewedAt: null }, { merge: true });
        });
        await batch.commit();
      } catch (err) {
        console.error('Failed to clear member round data', err);
      }
    }

    await setDoc(doc(db, 'hangmanRooms', roomId), { started: start, word: start ? word : '' }, { merge: true });
  };

  const assignColor = async (memberId: string, color: string) => {
    await setDoc(doc(db, 'hangmanRooms', roomId!, 'members', memberId), { color }, { merge: true });
  };

  const reviewResults = async () => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'hangmanRooms', roomId);
      const roomSnap = await getDoc(roomRef);
      const currentWord = roomSnap.exists() ? (roomSnap.data() as any).word || '' : '';
      const membersColRef = collection(db, 'hangmanRooms', roomId, 'members');
      const snapshot = await getDocs(membersColRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => {
        const m = d.data() as any;
        const guess = (m.guess || '').toString().trim().toLowerCase();
        const correct = currentWord && guess === currentWord.trim().toLowerCase();
        const mRef = doc(db, 'hangmanRooms', roomId, 'members', d.id);
        batch.set(mRef, { reviewed: true, reviewedCorrect: correct, reviewedAt: serverTimestamp() }, { merge: true });
      });
      // mark room as reviewed/time
      const roomReviewRef = roomRef;
      batch.set(roomReviewRef, { lastReviewedAt: serverTimestamp() }, { merge: true });
      await batch.commit();
    } catch (err) {
      console.error('reviewResults err', err);
      alert('Failed to perform review');
    }
  };

  return (
    <div>
      {!roomId ? (
        <div>
          <button onClick={createRoom} className="px-4 py-2 bg-green-600 text-white rounded">Create Hangman Room</button>
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* LEFT PANEL - Controls */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Room ID</div>
              <div className="font-mono text-white">{roomId}</div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="mb-2 text-sm text-gray-300">Enter Word (visible only to teacher)</div>
              <input value={word} onChange={e => setWord(e.target.value)} className="w-full p-2 bg-gray-800 rounded mb-2 text-white" />
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">Auto-review when all submitted</label>
                <button
                  onClick={async () => {
                    if (!roomId) return;
                    const next = !autoReview;
                    await setDoc(doc(db, 'hangmanRooms', roomId), { autoReview: next }, { merge: true });
                    setAutoReview(next);
                  }}
                  className={`px-3 py-1 rounded ${autoReview ? 'bg-green-600' : 'bg-gray-700'} text-white text-sm`}
                >
                  {autoReview ? 'On' : 'Off'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleStart(true)} className="flex-1 py-2 bg-blue-600 text-white rounded">Start Now</button>
                <button onClick={() => toggleStart(false)} className="flex-1 py-2 bg-gray-600 text-white rounded">Reset</button>
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="mb-2 text-sm text-gray-300">Joined Students</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {members.length === 0 && <div className="text-gray-400">No students yet</div>}
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                    <div className="flex items-center gap-3 flex-1">
                      {m.color && (
                        <div
                          className="w-5 h-5 rounded-full border-2 border-white shadow-lg"
                          style={{
                            backgroundColor:
                              m.color === 'red'
                                ? '#ef4444'
                                : m.color === 'green'
                                ? '#22c55e'
                                : m.color === 'blue'
                                ? '#3b82f6'
                                : '#9ca3af',
                          }}
                          title={`Color: ${m.color}`}
                        />
                      )}
                      <div className="text-white text-sm">{m.name || m.id}</div>
                    </div>
                    <div className="flex gap-1">
                      {['red','green','blue'].map(c => (
                        <button
                          key={c}
                          onClick={() => assignColor(m.id, c)}
                          className={`rounded transition-all ${
                            m.color === c
                              ? `w-8 h-8 border-2 border-white shadow-lg ${
                                  c === 'red'
                                    ? 'bg-red-500'
                                    : c === 'green'
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                                }`
                              : `w-6 h-6 opacity-60 hover:opacity-100 ${c === 'red' ? 'bg-red-500' : c === 'green' ? 'bg-green-500' : 'bg-blue-500'}`
                          }`}
                          title={`Assign ${c} color`}
                        ></button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={reviewResults} className="flex-1 py-2 bg-yellow-600 text-white rounded">Review</button>
              <button onClick={async () => { await setDoc(doc(db, 'hangmanLobby', 'current'), { activeRoomId: '' }, { merge: true }); setRoomId(null); }} className="flex-1 py-2 bg-red-600 text-white rounded">Close Room</button>
            </div>
          </div>

          {/* RIGHT PANEL - Results */}
          <div className="flex-1 bg-gray-900 p-4 rounded overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">📝 Answers & Results</h3>
            {roomDoc?.started ? (
              <div className="space-y-3">
                {members.length === 0 ? (
                  <div className="text-gray-400 text-sm">Waiting for students to submit...</div>
                ) : (
                  <>
                    {/* Show winner banner if someone got it right */}
                    {members.some(m => m.reviewed && m.reviewedCorrect) && (
                      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 rounded mb-4 border-2 border-green-500">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white mb-2">🏆 WINNER! 🏆</div>
                          {members.find(m => m.reviewed && m.reviewedCorrect) && (
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border-2 border-white"
                                style={{
                                  backgroundColor:
                                    members.find(m => m.reviewed && m.reviewedCorrect)?.color === 'red'
                                      ? '#ef4444'
                                      : members.find(m => m.reviewed && m.reviewedCorrect)?.color === 'green'
                                      ? '#22c55e'
                                      : members.find(m => m.reviewed && m.reviewedCorrect)?.color === 'blue'
                                      ? '#3b82f6'
                                      : '#9ca3af',
                                }}
                              />
                              <span className="text-xl font-bold text-white capitalize">
                                {members.find(m => m.reviewed && m.reviewedCorrect)?.name} ({members.find(m => m.reviewed && m.reviewedCorrect)?.color} Team)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {members.map(m => (
                      <div
                        key={m.id}
                        className={`p-3 rounded border-l-4 ${
                          m.reviewed && m.reviewedCorrect
                            ? 'bg-green-900 border-l-green-500'
                            : 'bg-gray-800 border-l-gray-600'
                        }`}
                        style={
                          !m.reviewed || !m.reviewedCorrect
                            ? {
                                borderLeftColor:
                                  m.color === 'red'
                                    ? '#ef4444'
                                    : m.color === 'green'
                                    ? '#22c55e'
                                    : m.color === 'blue'
                                    ? '#3b82f6'
                                    : '#6b7280',
                              }
                            : {}
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-white font-semibold text-sm">{m.name || m.id}</div>
                            {m.submittedAt ? (
                              <>
                                <div className="text-gray-300 text-sm mt-1">
                                  Guess: <span className="font-mono font-bold text-yellow-300">{m.guess || '—'}</span>
                                </div>
                                {m.reviewed && (
                                  <div className={`text-sm font-semibold mt-1 ${m.reviewedCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {m.reviewedCorrect ? '✓ Correct!' : '✗ Incorrect'}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-gray-500 text-sm mt-1">Waiting for submission...</div>
                            )}
                          </div>
                          {m.submittedAt && !m.reviewed && (
                            <div className="text-blue-400 text-xs font-semibold">PENDING</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-8">Game not started yet. Click "Start Now" to begin.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const HangmanStudentApp = ({ currentUser }: { currentUser: any }) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; word?: string } | null>(null);

  useEffect(() => {
    const lobbyRef = doc(db, 'hangmanLobby', 'current');
    const unsub = onSnapshot(lobbyRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setActiveRoomId(data.activeRoomId || null);
      } else setActiveRoomId(null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    const roomRef = doc(db, 'hangmanRooms', activeRoomId);
    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() });
      else setRoom(null);
    });
    const membersCol = collection(db, 'hangmanRooms', activeRoomId, 'members');
    const unsubMembers = onSnapshot(membersCol, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // auto-join
    const join = async () => {
      if (!currentUser) return;
      const memberRef = doc(db, 'hangmanRooms', activeRoomId, 'members', currentUser.uid);
      await setDoc(memberRef, { name: currentUser.displayName || currentUser.email || 'Student', joinedAt: serverTimestamp() }, { merge: true });
    };
    join();

    return () => {
      unsubRoom();
      unsubMembers();
    };
  }, [activeRoomId, currentUser]);

  // Reset local submission state when the room restarts or a new word is set
  useEffect(() => {
    if (!room) return;
    // If teacher started a new game, clear previous submission/result so student sees fresh game
    if (room.started) {
      setSubmitted(false);
      setResult(null);
      setGuess('');
    }
  }, [room?.id, room?.started, room?.word]);

  const submitGuess = async () => {
    if (!activeRoomId || !currentUser) return;
    const memberRef = doc(db, 'hangmanRooms', activeRoomId, 'members', currentUser.uid);
    const correct = room && room.word && guess.trim().toLowerCase() === room.word.trim().toLowerCase();
    await setDoc(memberRef, { guess, correct, submittedAt: serverTimestamp() }, { merge: true });
    // mark as submitted locally, but DO NOT show result until teacher reviews
    setSubmitted(true);
  };

  // Update local result when teacher performs review (member doc gets `reviewed`)
  useEffect(() => {
    if (!currentUser) return;
    const my = members.find(m => m.id === currentUser.uid);
    if (!my) return;
    if (my.reviewed) {
      setResult({ correct: !!my.reviewedCorrect, word: room?.word });
      setSubmitted(true);
    }
  }, [members, currentUser, room?.word]);

  const submittedCount = members.filter(m => !!m.submittedAt).length;
  const totalCount = members.length;

  if (!activeRoomId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Hangman (Waiting)</h2>
        <div className="bg-gray-800 p-4 rounded text-gray-300">No active hangman room right now. Wait for your teacher to create one.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Hangman — Waiting Room</h2>
      <div className="bg-gray-900 p-4 rounded mb-3">
        <div className="text-sm text-gray-400">Room</div>
        <div className="font-mono text-white">{activeRoomId}</div>
      </div>

      <div className="bg-gray-900 p-3 rounded mb-3">
        <div className="text-sm text-gray-400 mb-2">Students Joined</div>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
              <div className="text-white">{m.name}</div>
              <div className="text-sm text-gray-300">{m.color ? <span style={{textTransform:'capitalize'}}>{m.color}</span> : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {!room?.started ? (
        <div className="text-gray-400">Waiting for teacher to start the game...</div>
      ) : (
        <div className="space-y-3">
          {!submitted ? (
            <div>
              <div className="text-sm text-gray-400 mb-2">Enter your guess</div>
              <input className="w-full p-2 bg-gray-800 rounded text-white mb-2" value={guess} onChange={e => setGuess(e.target.value)} />
              <button onClick={submitGuess} className="w-full py-2 bg-green-600 text-white rounded">Submit</button>
            </div>
          ) : (
            <div className="p-4 rounded bg-gray-900 text-center">
              {!result ? (
                <div className="text-gray-300 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <div>
                    Submitted — waiting for the teacher to review everyone's answers ({submittedCount}/{totalCount} submitted)
                  </div>
                </div>
              ) : result.correct ? (
                <div>
                  <div className="text-2xl font-bold text-green-400">Congratulations!</div>
                  <div className="text-white text-lg">You guessed the word correctly.</div>
                  {members.find(m => m.id === currentUser?.uid)?.color && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white"
                        style={{
                          backgroundColor:
                            members.find(m => m.id === currentUser?.uid)?.color === 'red'
                              ? '#ef4444'
                              : members.find(m => m.id === currentUser?.uid)?.color === 'green'
                              ? '#22c55e'
                              : members.find(m => m.id === currentUser?.uid)?.color === 'blue'
                              ? '#3b82f6'
                              : '#9ca3af',
                        }}
                      />
                      <span className="font-bold text-white capitalize">
                        {members.find(m => m.id === currentUser?.uid)?.color} Team Wins!
                      </span>
                    </div>
                  )}
                  <div className="mt-3 text-4xl">🎈🎉🎈</div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-yellow-300">Nice try</div>
                  <div className="text-white text-lg">The correct word was: <span className="font-mono">{result?.word}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Game2App = () => (
  <div className="p-6 space-y-4">
    <h2 className="text-2xl font-bold text-white mb-6">Game 2</h2>
    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-12 rounded-lg text-center text-white">
      <div className="text-4xl mb-4">🎮</div>
      <div className="text-2xl font-bold">Game 2</div>
      <div className="text-sm mt-2">Coming Soon</div>
    </div>
  </div>
);

const Game3App = () => (
  <div className="p-6 space-y-4">
    <h2 className="text-2xl font-bold text-white mb-6">Game 3</h2>
    <div className="bg-gradient-to-br from-lime-500 to-green-600 p-12 rounded-lg text-center text-white">
      <div className="text-4xl mb-4">🎯</div>
      <div className="text-2xl font-bold">Game 3</div>
      <div className="text-sm mt-2">Coming Soon</div>
    </div>
  </div>
);

const UsersApp = ({ currentUser, preSelectedSender }: { currentUser: { uid: string; email: string } | null, preSelectedSender?: { id: string; name: string } | null }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(preSelectedSender ? { id: preSelectedSender.id, name: preSelectedSender.name, email: '' } : null);
  const [messagingUser, setMessagingUser] = useState<User | null>(preSelectedSender ? { id: preSelectedSender.id, name: preSelectedSender.name, email: '' } : null);

  if (messagingUser && currentUser) {
    return (
      <Messaging
        recipient={messagingUser}
        currentUser={currentUser}
        onBack={() => setMessagingUser(null)}
      />
    );
  }

  if (selectedUser) {
    return (
      <UserProfile
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onMessage={(user) => setMessagingUser(user)}
      />
    );
  }

  return (
    <UsersList onSelectUser={setSelectedUser} />
  );
};

export const AppLauncher = ({ app, onClose, preSelectedSender, onOpenApp }: AppLauncherProps) => {
  const currentUser = auth.currentUser;

  switch (app.id) {
    case 'mail':
      return <div className="text-white">Mail app not available</div>;
    case 'tictactoe':
      return <TicTacToeApp />;
    case 'inbox':
      return currentUser ? (
        <InboxApp currentUser={{ uid: currentUser.uid, email: currentUser.email || '' }} />
      ) : (
        <div className="p-6 text-center">
          <div className="text-lg text-gray-400">Please log in to access inbox</div>
        </div>
      );
    case 'calendar':
      return currentUser ? (
        <CalendarApp currentUser={currentUser} />
      ) : (
        <div className="p-6 text-center">
          <div className="text-lg text-gray-400">Please log in to access schedule</div>
        </div>
      );
    case 'bank':
      return <BankApp currentUser={currentUser} />;
    case 'library':
      return <LibraryApp />;
    case 'profile':
      return <ProfileApp currentUser={currentUser} />;
    case 'live':
      return <LiveApp onOpenApp={onOpenApp} />;
    case 'teacher':
      return <TeacherApp currentUser={currentUser} />;
    case 'game2':
      return <Game2App />;
    case 'game3':
      return <Game3App />;
    case 'englishlanguage':
      return <EnglishTicTacToe onClose={onClose} />;
    case 'wordrunner':
      return <WordRunner onClose={onClose} />;
    case 'handgrabber':
      return <Handgrabber onClose={onClose} />;
    case 'minecraft':
      return <MinecraftGame onClose={onClose} />;
    case 'hangman':
      return <HangmanStudentApp currentUser={currentUser} />;
    case 'homework':
      return currentUser ? (
        <StudentHomework currentUser={currentUser} onClose={onClose} />
      ) : (
        <div className="p-6 text-center">
          <div className="text-lg text-gray-400">Please log in to access homework</div>
        </div>
      );
    case 'users':
      return currentUser ? (
        <UsersApp currentUser={{ uid: currentUser.uid, email: currentUser.email || '' }} preSelectedSender={preSelectedSender} />
      ) : (
        <div className="p-6 text-center">
          <div className="text-lg text-gray-400">Please log in to access users</div>
        </div>
      );
    default:
      return (
        <div className="p-6">
          <div className="text-center">
            <div className="text-lg text-gray-400">App not found</div>
          </div>
        </div>
      );
  }
};
