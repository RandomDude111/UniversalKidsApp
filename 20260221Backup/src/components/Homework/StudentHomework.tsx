import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Check, X } from 'lucide-react';

interface HomeworkAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  title: string;
  description?: string;
  questions: Array<{
    question: string;
    answer: string;
    note: string;
  }>;
  imageUrl?: string | null;
  createdAt: any;
  status?: string;
  isActive?: boolean;
}

interface StudentAnswer {
  questionIndex: number;
  studentAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  note: string;
}

export const StudentHomework = ({ currentUser, onClose }: { currentUser: any; onClose?: () => void }) => {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [assignmentGrades, setAssignmentGrades] = useState<Record<string, { correct: number; total: number }>>({});
  const [isReviewOnly, setIsReviewOnly] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<StudentAnswer[]>([]);
  const [redoMode, setRedoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const allCorrect = results.length > 0 && results.every(r => r.isCorrect);

  // Fetch homework assignments for current student
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchAssignments = async () => {
      try {
        const homeworkCol = collection(db, 'homework');
        const q = query(homeworkCol, where('studentId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const assignments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HomeworkAssignment[];

        // Exclude deleted or explicitly deactivated homework so students don't see them
        const visible = assignments.filter(a => (a as any).status !== 'deleted' && (a as any).isActive !== false);
        setAssignments(visible);

        // Fetch student's submission (if any) for each assignment to compute grade
        try {
          const grades: Record<string, { correct: number; total: number }> = {};
          await Promise.all(visible.map(async (a) => {
            try {
              const subRef = doc(db, 'homework', a.id, 'submissions', currentUser.uid);
              const snap = await getDoc(subRef);
              if (snap.exists()) {
                const data: any = snap.data();
                const res = data.finalResults || data.results || [];
                const total = Array.isArray(res) ? res.length : 0;
                const correct = Array.isArray(res) ? res.filter((r: any) => r.isCorrect).length : 0;
                grades[a.id] = { correct, total };
              }
            } catch (e) {
              console.error('Error fetching submission for', a.id, e);
            }
          }));
          setAssignmentGrades(grades);
        } catch (e) {
          console.error('Error computing grades:', e);
        }
      } catch (error) {
        console.error('Error fetching homework:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [currentUser]);

  const handleSelectAssignment = async (assignment: HomeworkAssignment) => {
    setSelectedAssignment(assignment);
    setRedoMode(false);

    // try to load any existing submission so student can review
    try {
      const subRef = doc(db, 'homework', assignment.id, 'submissions', currentUser.uid);
      const snap = await getDoc(subRef);
        if (snap.exists()) {
        const data: any = snap.data();
          const review = data.status === 'finished' || !!data.finishedAt || !!data.finalResults;
        const answers: string[] = Array.isArray(data.finalAnswers)
          ? data.finalAnswers
          : Array.isArray(data.answers)
            ? data.answers
            : new Array(assignment.questions.length).fill('');

        const res = Array.isArray(data.finalResults)
          ? data.finalResults
          : Array.isArray(data.results)
            ? data.results
            : [];

        setStudentAnswers(answers.concat([]).slice(0, assignment.questions.length));
        setResults(res as StudentAnswer[]);
        setSubmitted(res.length > 0);
        setIsReviewOnly(!!review);

        // update cached grade for list display
        const total = res.length;
        const correct = res.filter((r: any) => r.isCorrect).length;
        setAssignmentGrades(prev => ({ ...prev, [assignment.id]: { correct, total } }));
        return;
      }
    } catch (e) {
      console.error('Error loading submission for review:', e);
    }

    // no existing submission
    setStudentAnswers(new Array(assignment.questions.length).fill(''));
    setSubmitted(false);
    setResults([]);
    setIsReviewOnly(false);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...studentAnswers];
    newAnswers[index] = value;
    setStudentAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    // Grade answers
    const newResults: StudentAnswer[] = selectedAssignment.questions.map((q, index) => {
      const studentAnswer = (studentAnswers[index] || '').trim();
      const studentAnswerNormalized = studentAnswer.toLowerCase();
      const correctAnswer = q.answer.trim();
      const correctNormalized = correctAnswer.toLowerCase();
      const isCorrect = studentAnswerNormalized === correctNormalized;

      return {
        questionIndex: index,
        studentAnswer,
        isCorrect,
        correctAnswer: q.answer,
        note: q.note
      };
    });

    setResults(newResults);
    setSubmitted(true);
    setRedoMode(false);

    // Save/update submission to database. Preserve initial incorrect answers on first submission.
    try {
      const submissionRef = doc(db, 'homework', selectedAssignment.id, 'submissions', currentUser.uid);
      const existing = await getDoc(submissionRef);

      const initialIncorrect = newResults
        .filter(r => !r.isCorrect)
        .map(r => ({ questionIndex: r.questionIndex, studentAnswer: r.studentAnswer }));

      const payload: any = {
        studentName: currentUser.displayName || currentUser.email || 'Student',
        studentId: currentUser.uid,
        answers: studentAnswers,
        results: newResults,
        lastSubmittedAt: serverTimestamp()
      };

      // If no existing doc or it doesn't have initialIncorrectAnswers, add it now
      if (!existing.exists() || !existing.data()?.initialIncorrectAnswers) {
        payload.initialIncorrectAnswers = initialIncorrect;
        payload.firstSubmittedAt = serverTimestamp();
      }

      await setDoc(submissionRef, payload, { merge: true });
    } catch (error) {
      console.error('Error saving submission:', error);
    }
  };

  const handleRedo = () => {
    setRedoMode(true);
    // keep submitted true so we can still show score, but allow editing
  };

  const handleSubmitRevision = async () => {
    if (!selectedAssignment) return;

    // Re-grade with current studentAnswers
    const newResults: StudentAnswer[] = selectedAssignment.questions.map((q, index) => {
      const studentAnswer = (studentAnswers[index] || '').trim();
      const studentAnswerNormalized = studentAnswer.toLowerCase();
      const correctAnswer = q.answer.trim();
      const correctNormalized = correctAnswer.toLowerCase();
      const isCorrect = studentAnswerNormalized === correctNormalized;

      return {
        questionIndex: index,
        studentAnswer,
        isCorrect,
        correctAnswer: q.answer,
        note: q.note
      };
    });

    setResults(newResults);
    setRedoMode(false);

    try {
      const submissionRef = doc(db, 'homework', selectedAssignment.id, 'submissions', currentUser.uid);
      await setDoc(
        submissionRef,
        {
          answers: studentAnswers,
          results: newResults,
          lastSubmittedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving revised submission:', error);
    }
  };

  const handleFinish = async () => {
    if (!selectedAssignment) return;

    try {
      const submissionRef = doc(db, 'homework', selectedAssignment.id, 'submissions', currentUser.uid);
      await setDoc(
        submissionRef,
        {
          finalAnswers: studentAnswers,
          finalResults: results,
          finishedAt: serverTimestamp(),
          status: 'finished'
        },
        { merge: true }
      );

      // Keep UI showing submitted results but exit redo mode
      setRedoMode(false);
      setSubmitted(true);
      // Also update parent homework doc to mark completed
      markHomeworkCompleted();
      // After finishing, navigate back to home (close the app) if provided
      if (onClose) {
        try {
          onClose();
        } catch (e) {
          console.error('Error calling onClose after finish:', e);
        }
      }
    } catch (error) {
      console.error('Error finishing submission:', error);
    }
  };

  // When a student finishes, also mark the parent homework doc as completed
  const markHomeworkCompleted = async () => {
    if (!selectedAssignment) return;
    try {
      const hwRef = doc(db, 'homework', selectedAssignment.id);
      await updateDoc(hwRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: currentUser.uid
      });
      console.log('✅ Marked homework as completed:', selectedAssignment.id);
    } catch (err) {
      console.error('Error marking homework completed:', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg text-gray-400">Please log in to access homework</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg text-gray-400">Loading homework...</div>
      </div>
    );
  }

  // Show assignment list
  if (!selectedAssignment) {
    return (
      <div className="w-full h-full bg-black p-6 text-white overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Homework</h1>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No homework assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignments.map(assignment => {
              const grade = assignmentGrades[assignment.id];
              const isDone = assignment.status === 'completed' || !!grade;

              return (
                <button
                  key={assignment.id}
                  onClick={() => handleSelectAssignment(assignment)}
                  className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-lg">{assignment.title}</p>
                    <p className="text-sm text-gray-400">{assignment.teacherName}</p>
                    <p className="text-sm text-gray-500">{assignment.questions.length} question{assignment.questions.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="ml-4">
                    {isDone ? (
                      <div className="px-3 py-1 bg-green-700 text-green-100 rounded-full text-sm font-semibold">
                        Done {grade ? `${grade.correct}/${grade.total}` : ''}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Show homework detail
  return (
    <div className="w-full h-full bg-black p-6 text-white overflow-y-auto flex flex-col">
      <button
        onClick={() => setSelectedAssignment(null)}
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Homework from {selectedAssignment.teacherName}</h1>

      {/* Title and Description */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">{selectedAssignment.title}</h2>
        {selectedAssignment.description && (
          <p className="text-gray-300 text-sm">{selectedAssignment.description}</p>
        )}
        {selectedAssignment.imageUrl && (
          <div className="mt-3">
            <img src={selectedAssignment.imageUrl} alt="homework" className="max-w-md rounded" />
          </div>
        )}
      </div>

      {/* Questions and Answers */}
      <div className="flex-1 mb-6">
        {selectedAssignment.questions.map((q, index) => {
          const res = results[index];
          const showGraded = submitted && !redoMode && res;
          const showInput = !submitted || redoMode;

          return (
            <div key={index} className="mb-6 p-4 bg-gray-800 rounded-lg">
              <p className="text-lg font-semibold mb-2">Q{index + 1}: {q.question}</p>

              {showGraded ? (
                <div>
                  <p className="text-sm text-gray-300 mb-2">Your answer: {res.studentAnswer || '(blank)'}</p>
                  <div
                    className={`p-3 rounded-lg ${
                      res.isCorrect ? 'bg-green-900' : 'bg-red-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {res.isCorrect ? (
                        <Check size={20} className="text-green-400" />
                      ) : (
                        <X size={20} className="text-red-400" />
                      )}
                      <span className={res.isCorrect ? 'text-green-400' : 'text-red-400'}>
                        {res.isCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    {!res.isCorrect && (
                      <>
                        <p className="text-sm text-white">Correct answer: {res.correctAnswer}</p>
                        {res.note && (
                          <p className="text-sm text-gray-200 mt-2">Note: {res.note}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {showInput ? (
                    <input
                      type="text"
                      value={studentAnswers[index] || ''}
                      onChange={e => handleAnswerChange(index, e.target.value)}
                      placeholder="Enter your answer"
                      readOnly={isReviewOnly}
                      className={`w-full p-2 bg-gray-700 rounded text-white placeholder-gray-400 border ${res && !res.isCorrect ? 'border-red-500' : 'border-gray-600'}`}
                    />
                  ) : null}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          Submit Homework
        </button>
      )}

      {submitted && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold">Score: {results.filter(r => r.isCorrect).length}/{results.length}</p>
          </div>

          {!redoMode ? (
            isReviewOnly ? (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Back to Homework List
                </button>
              </div>
            ) : (
              <div className="flex gap-3 justify-center">
                {!allCorrect && (
                  <button
                    onClick={handleRedo}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                  >
                    Redo Homework
                  </button>
                )}
                <button
                  onClick={handleFinish}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  Finished
                </button>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Back to Homework List
                </button>
              </div>
            )
          ) : (
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSubmitRevision}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Submit Revision
              </button>
              <button
                onClick={() => setRedoMode(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Back to Homework List
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
