import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

interface VotingProps {
  currentUser: any | null;
  isTeacher?: boolean;
}

// Button and chart colors: 1=grey, 2=green, 3=blue, 4=yellow
const COLORS = ['#6B7280', '#10B981', '#3B82F6', '#FBBF24'];

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(angleInRadians)),
    y: cy + (r * Math.sin(angleInRadians))
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ');
}

export default function Voting({ currentUser, isTeacher }: VotingProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [votes, setVotes] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);

  // Listen for current voting session
  useEffect(() => {
    const ref = doc(db, 'adminSettings', 'voting');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null;
      if (data && data.sessionId) {
        setSessionId(String(data.sessionId));
        setIsActive(Boolean(data.isActive));
      } else {
        setSessionId(null);
        setIsActive(false);
      }
    });
    return unsub;
  }, []);

  // Listen for votes for current session
  useEffect(() => {
    setLoading(true);
    if (!sessionId) {
      setVotes([]);
      setLoading(false);
      return;
    }
    const votesCol = collection(db, 'votingVotes');
    const q = query(votesCol, where('sessionId', '==', sessionId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setVotes(list);
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  const startVoting = async () => {
    const newSession = String(Date.now());
    await setDoc(doc(db, 'adminSettings', 'voting'), {
      sessionId: newSession,
      isActive: true,
      startedAt: serverTimestamp(),
    }, { merge: true });
  };

  const resetVoting = async () => {
    if (!sessionId) return;
    // delete votes for this session
    const votesCol = collection(db, 'votingVotes');
    const q = query(votesCol, where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    // clear session
    await setDoc(doc(db, 'adminSettings', 'voting'), { sessionId: null, isActive: false }, { merge: true });
  };

  // compute current user's vote (locked)
  const myVoteEntry = currentUser ? votes.find(v => v.uid === currentUser.uid) : null;
  const myVote = myVoteEntry ? Number(myVoteEntry.choice) : null;

  const castVote = async (choice: number) => {
    if (!currentUser || !sessionId) return alert('No active vote');
    // prevent changing vote once cast
    if (myVote) return;
    const uid = currentUser.uid;
    const name = currentUser.name || currentUser.displayName || currentUser.email || 'Anonymous';
    const id = `${sessionId}_${uid}`;
    await setDoc(doc(db, 'votingVotes', id), {
      sessionId,
      uid,
      name,
      choice,
      ts: serverTimestamp()
    }, { merge: true });
  };

  const counts = [0, 0, 0, 0];
  votes.forEach(v => {
    const c = Number(v.choice);
    if (c >= 1 && c <= 4) counts[c - 1]++;
  });
  const total = counts.reduce((a, b) => a + b, 0);

  const getTextColor = (index: number) => {
    // for yellow (index 3) use black text, otherwise white
    return index === 3 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="w-full h-full p-6 bg-black text-white relative">
      {/* Fullscreen chosen answer for kids */}
      {!isTeacher && myVote && (
        <div style={{background: COLORS[myVote - 1]}} className="absolute inset-0 z-40 flex items-center justify-center">
          <div style={{color: getTextColor(myVote - 1)}} className="text-9xl font-extrabold">{myVote}</div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Voting</h2>
        {isTeacher && (
          <div className="flex gap-2">
            <button onClick={startVoting} className="px-3 py-2 bg-green-600 rounded">Start Voting</button>
            <button onClick={resetVoting} className="px-3 py-2 bg-red-600 rounded">Reset Voting</button>
            <button onClick={() => setShowList(s => !s)} className="px-3 py-2 bg-cyan-600 rounded">{showList ? 'Hide' : 'View All Votes'}</button>
          </div>
        )}
      </div>

      {isTeacher ? (
        // Teacher view: large pie chart + votes list
        <div className="flex gap-6 h-full">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            <svg width="500" height="500" viewBox="0 0 140 140">
              {(() => {
                let start = 0;
                return counts.map((c, i) => {
                  const angle = total === 0 ? 0 : (c / total) * 360;
                  const path = describeArc(70, 70, 60, start, start + angle);
                  start += angle;
                  return (
                    <path key={i} d={path} fill={COLORS[i]} stroke="#000" strokeWidth={0.5} />
                  );
                });
              })()}
            </svg>
            <div className="mt-6 flex gap-6">
              {counts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div style={{width:16,height:16,background:COLORS[i]}} />
                  <div className="text-sm">Option {i+1}: {c} ({total === 0 ? '0%' : Math.round((c/total)*100) + '%'})</div>
                </div>
              ))}
            </div>
          </div>

          {showList && (
            <div className="w-80 bg-gray-900 p-4 rounded">
              <h4 className="font-semibold mb-2">All Votes</h4>
              {loading ? <div className="text-gray-400">Loading...</div> : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {votes.map(v => (
                    <div key={v.id} className="p-2 bg-gray-800 rounded flex justify-between">
                      <div>{v.name}</div>
                      <div className="font-bold">{v.choice}</div>
                    </div>
                  ))}
                  {votes.length === 0 && <div className="text-gray-400">No votes yet</div>}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Student view: 4 voting buttons + results
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map((n) => (
                <button key={n}
                  onClick={() => castVote(n)}
                  disabled={!isActive || (!!myVote && !isTeacher)}
                  style={{background: COLORS[n-1], color: getTextColor(n-1)}}
                  className={`w-full h-28 flex items-center justify-center text-3xl font-bold rounded ${(!isActive || (!!myVote && !isTeacher)) ? 'opacity-80 cursor-not-allowed' : 'hover:brightness-90'}`}>
                  {n}
                </button>
              ))}
            </div>
            {!isActive && <div className="mt-4 text-gray-400">No active vote — teacher can start voting.</div>}
          </div>

          <div>
            <div className="bg-gray-900 p-4 rounded mb-4">
              <h3 className="font-semibold">Results</h3>
              <div className="flex items-center gap-4 mt-4">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {(() => {
                    let start = 0;
                    return counts.map((c, i) => {
                      const angle = total === 0 ? 0 : (c / total) * 360;
                      const path = describeArc(70, 70, 60, start, start + angle);
                      start += angle;
                      return (
                        <path key={i} d={path} fill={COLORS[i]} stroke="#000" strokeWidth={0.5} />
                      );
                    });
                  })()}
                </svg>

                <div>
                  {counts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div style={{width:12,height:12,background:COLORS[i]}} />
                      <div>Option {i+1}: {c} ({total === 0 ? '0%' : Math.round((c/total)*100) + '%'})</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showList && (
              <div className="bg-gray-900 p-4 rounded">
                <h4 className="font-semibold mb-2">All Votes</h4>
                {loading ? <div className="text-gray-400">Loading...</div> : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {votes.map(v => (
                      <div key={v.id} className="p-2 bg-gray-800 rounded flex justify-between">
                        <div>{v.name}</div>
                        <div className="font-bold">{v.choice}</div>
                      </div>
                    ))}
                    {votes.length === 0 && <div className="text-gray-400">No votes yet</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
