import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  createdAt: any;
}

interface StudentAnswer {
  questionIndex: number;
  studentAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  note: string;
}

export const StudentHomework = ({ currentUser }: { currentUser: any }) => {
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);

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
        setAssignments(assignments);
      } catch (error) {
        console.error('Error fetching homework:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [currentUser]);

  const handleSelectAssignment = (assignment: HomeworkAssignment) => {
    setSelectedAssignment(assignment);
    setStudentAnswers(new Array(assignment.questions.length).fill(''));
    setSubmitted(false);
    setResults([]);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...studentAnswers];
    newAnswers[index] = value;
    setStudentAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    // Check answers
    const newResults: StudentAnswer[] = selectedAssignment.questions.map((q, index) => {
      const studentAnswer = studentAnswers[index].trim().toLowerCase();
      const correctAnswer = q.answer.trim().toLowerCase();
      const isCorrect = studentAnswer === correctAnswer;

      return {
        questionIndex: index,
        studentAnswer: studentAnswers[index],
        isCorrect,
        correctAnswer: q.answer,
        note: q.note
      };
    });

    setResults(newResults);
    setSubmitted(true);

    // Save submission to database
    try {
      await setDoc(
        doc(db, 'homework', selectedAssignment.id, 'submissions', currentUser.uid),
        {
          studentName: currentUser.displayName || currentUser.email || 'Student',
          studentId: currentUser.uid,
          answers: studentAnswers,
          results: newResults,
          submittedAt: serverTimestamp()
        }
      );
    } catch (error) {
      console.error('Error saving submission:', error);
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
            {assignments.map(assignment => (
              <button
                key={assignment.id}
                onClick={() => handleSelectAssignment(assignment)}
                className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
              >
                <p className="font-semibold text-lg">{assignment.title}</p>
                <p className="text-sm text-gray-400">{assignment.teacherName}</p>
                <p className="text-sm text-gray-500">
                  {assignment.questions.length} question{assignment.questions.length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
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
      </div>

      {/* Questions and Answers */}
      <div className="flex-1 mb-6">
        {selectedAssignment.questions.map((q, index) => (
          <div key={index} className="mb-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-lg font-semibold mb-2">Q{index + 1}: {q.question}</p>
            {submitted && results[index] ? (
              <div>
                <p className="text-sm text-gray-300 mb-2">Your answer: {results[index].studentAnswer || '(blank)'}</p>
                <div
                  className={`p-3 rounded-lg ${
                    results[index].isCorrect ? 'bg-green-900' : 'bg-red-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {results[index].isCorrect ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <X size={20} className="text-red-400" />
                    )}
                    <span className={results[index].isCorrect ? 'text-green-400' : 'text-red-400'}>
                      {results[index].isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  {!results[index].isCorrect && (
                    <>
                      <p className="text-sm text-white">Correct answer: {results[index].correctAnswer}</p>
                      {results[index].note && (
                        <p className="text-sm text-gray-200 mt-2">Note: {results[index].note}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={studentAnswers[index] || ''}
                onChange={e => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
              />
            )}
          </div>
        ))}
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
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-2">Homework submitted!</p>
          <button
            onClick={() => setSelectedAssignment(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Back to Homework List
          </button>
        </div>
      )}
    </div>
  );
};
