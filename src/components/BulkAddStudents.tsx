import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, X } from 'lucide-react';

interface StudentRow {
  firstName: string;
  lastName: string;
  birthday: string;
}

export default function BulkAddStudents({ currentUser }: { currentUser: any }) {
  const [role, setRole] = useState('student');
  const [classInput, setClassInput] = useState('');
  const [fundsInput, setFundsInput] = useState('');
  const [afterthatInput, setAfterthatInput] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const addStudentRow = () => {
    setStudents([...students, { firstName: '', lastName: '', birthday: '' }]);
  };

  const removeStudentRow = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, field: keyof StudentRow, value: string) => {
    const newStudents = [...students];
    newStudents[index][field] = value;
    setStudents(newStudents);
  };

  const generateEmail = (firstName: string, lastName: string) => {
    if (!firstName || !lastName || !afterthatInput) return '';
    const initials = (firstName[0] + lastName[0]).toLowerCase();
    const name = firstName.toLowerCase();
    return `${name}${initials}@${afterthatInput}.com`;
  };

  const validateAndCreate = async () => {
    const newErrors: string[] = [];
    
    if (!classInput.trim()) newErrors.push('Class is required');
    if (!afterthatInput.trim()) newErrors.push('Afterat domain is required');
    if (students.length === 0) newErrors.push('At least one student is required');

    students.forEach((s, i) => {
      if (!s.firstName.trim()) newErrors.push(`Student ${i + 1}: First name is required`);
      if (!s.lastName.trim()) newErrors.push(`Student ${i + 1}: Last name is required`);
      if (!s.birthday) newErrors.push(`Student ${i + 1}: Birthday is required`);
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    setIsAdding(true);
    setMessage('Creating students...');

    const createdCount = { success: 0, failed: 0 };
    const failedNames: string[] = [];

    for (const student of students) {
      try {
        const email = generateEmail(student.firstName, student.lastName);
        const tempPassword = '123456';

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
        const uid = userCredential.user.uid;

        // Create Firestore user document
        await setDoc(doc(db, 'users', uid), {
          name: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName,
          lastName: student.lastName,
          email,
          birthday: student.birthday,
          class: classInput,
          balance: fundsInput ? Number(fundsInput) : 0,
          progress: 0,
          status: 'active',
          createdAt: serverTimestamp(),
          role: role
        });

        createdCount.success++;
      } catch (err: any) {
        createdCount.failed++;
        failedNames.push(`${student.firstName} ${student.lastName}: ${err.message}`);
      }
    }

    setIsAdding(false);
    setMessage(
      `✓ Created ${createdCount.success} student(s)${
        createdCount.failed > 0
          ? ` (${createdCount.failed} failed: ${failedNames.join('; ')})`
          : ''
      }`
    );

    if (createdCount.success > 0) {
      setStudents([]);
      setRole('student');
      setClassInput('');
      setFundsInput('');
      setAfterthatInput('');
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="text-2xl font-bold text-white mb-6">Bulk Add Students</h3>

      {/* Top controls */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block text-gray-300 text-sm mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2">Class</label>
          <input
            type="text"
            value={classInput}
            onChange={(e) => setClassInput(e.target.value)}
            placeholder="e.g., Oak"
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2">Balance (optional)</label>
          <input
            type="number"
            value={fundsInput}
            onChange={(e) => setFundsInput(e.target.value)}
            placeholder="e.g., 0"
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm mb-2">Afterat (domain)</label>
          <input
            type="text"
            value={afterthatInput}
            onChange={(e) => setAfterthatInput(e.target.value)}
            placeholder="e.g., uk"
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded">
          {errors.map((err, i) => (
            <div key={i} className="text-red-300 text-sm">{err}</div>
          ))}
        </div>
      )}

      {/* Student rows */}
      <div className="space-y-3 mb-6">
        {students.map((student, idx) => (
          <div key={idx} className="p-4 bg-gray-800 rounded border border-gray-700">
            <div className="grid grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-gray-300 text-xs mb-1">First Name</label>
                <input
                  type="text"
                  value={student.firstName}
                  onChange={(e) => updateStudent(idx, 'firstName', e.target.value)}
                  placeholder="First name"
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-1">Last Name</label>
                <input
                  type="text"
                  value={student.lastName}
                  onChange={(e) => updateStudent(idx, 'lastName', e.target.value)}
                  placeholder="Last name"
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-1">Birthday</label>
                <input
                  type="date"
                  value={student.birthday}
                  onChange={(e) => updateStudent(idx, 'birthday', e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
              <div>
                <button
                  onClick={() => removeStudentRow(idx)}
                  className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {afterthatInput && student.firstName && student.lastName && (
              <div className="mt-2 text-gray-400 text-xs">
                Email: <span className="text-blue-300">{generateEmail(student.firstName, student.lastName)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add row button */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={addStudentRow}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* Create button */}
      <button
        onClick={validateAndCreate}
        disabled={isAdding || students.length === 0}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded transition-colors"
      >
        {isAdding ? 'Creating...' : `Create ${students.length} Student(s)`}
      </button>

      {/* Message */}
      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('✓') ? 'bg-green-900 border border-green-600 text-green-300' : 'bg-blue-900 border border-blue-600 text-blue-300'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
