import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2 } from 'lucide-react';

interface StudentOption {
  id: string;
  name: string;
}

interface Question {
  question: string;
  answer: string;
  note: string;
}

export const TeacherHomework = ({ currentUser }: { currentUser: any }) => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', answer: '', note: '' }
  ]);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);
        const studentList: StudentOption[] = snapshot.docs
          .filter(doc => doc.id !== currentUser?.uid)
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || doc.data().email || 'Unknown'
          }));
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].id);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [currentUser]);



  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', answer: '', note: '' }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudentId || !title || questions.some(q => !q.question || !q.answer)) {
      alert('Please fill in all required fields (student, title, questions, and answers)');
      return;
    }

    setUploading(true);
    try {
      // Save homework to Firestore
      const homeworkRef = doc(collection(db, 'homework'));
      await setDoc(homeworkRef, {
        teacherId: currentUser?.uid,
        teacherName: currentUser?.displayName || currentUser?.email || 'Teacher',
        studentId: selectedStudentId,
        title,
        description,
        questions,
        createdAt: serverTimestamp(),
        status: 'assigned'
      });

      setSuccessMessage('Homework assigned successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        // Reset form
        setTitle('');
        setDescription('');
        setQuestions([{ question: '', answer: '', note: '' }]);
      }, 3000);
    } catch (error) {
      console.error('Error saving homework:', error);
      alert('Error saving homework. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser) {
    return <div className="p-6 text-center text-gray-400">Please log in as teacher</div>;
  }

  return (
    <div className="w-full bg-black text-white p-6 overflow-y-auto max-h-full">
      <h2 className="text-2xl font-bold mb-6">Assign Homework</h2>

      {successMessage && (
        <div className="p-4 bg-green-900 border border-green-600 rounded-lg mb-6 text-green-300">
          {successMessage}
        </div>
      )}

      {/* Student Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Select Student</label>
        <select
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          <option value="">Choose a student...</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Homework Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Math Chapter 5 Problems"
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add any additional instructions or notes here"
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 h-20"
        />
      </div>

      {/* Questions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Questions & Answers</h3>
        {questions.map((q, index) => (
          <div key={index} className="p-4 bg-gray-800 rounded-lg mb-4 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold">Q{index + 1}</h4>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(index)}
                  className="text-red-400 hover:text-red-300 transition"
                  title="Remove question"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">Question</label>
              <input
                type="text"
                value={q.question}
                onChange={e => handleQuestionChange(index, 'question', e.target.value)}
                placeholder="Enter question"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-400 mb-1">Answer</label>
              <input
                type="text"
                value={q.answer}
                onChange={e => handleQuestionChange(index, 'answer', e.target.value)}
                placeholder="Enter correct answer"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Note (optional)</label>
              <input
                type="text"
                value={q.note}
                onChange={e => handleQuestionChange(index, 'note', e.target.value)}
                placeholder="Add a note for students"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Plus size={20} /> Add Question
        </button>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
      >
        {uploading ? 'Uploading...' : 'Assign Homework'}
      </button>
    </div>
  );
};
