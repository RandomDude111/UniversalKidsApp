import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Users, CheckCircle, Archive, Copy, Eye, ToggleLeft, ChevronDown } from 'lucide-react';

interface StudentOption {
  id: string;
  name: string;
}

interface Question {
  question: string;
  answer: string;
  note: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  description?: string;
  studentId: string;
  studentName: string;
  questions: Question[];
  imageUrl?: string | null;
  createdAt: any;
  status: string;
  isActive: boolean;
  topic: string;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  answers: string[];
  results: any[];
  lastSubmittedAt: any;
  firstSubmittedAt: any;
  status: string;
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dpzshzyec';
const CLOUDINARY_UPLOAD_PRESET = 'homeworkCloud';
export const TeacherHomework = ({ currentUser }: { currentUser: any }) => {
  // component state
  const [activeTab, setActiveTab] = useState<'assign' | 'past' | 'check'>('assign');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([{ question: '', answer: '', note: '' }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Past homework state
  const [pastHomework, setPastHomework] = useState<HomeworkItem[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);

  const [groupLoading, setGroupLoading] = useState(false);
  
  // Submissions state
  const [submissions, setSubmissions] = useState<Map<string, StudentSubmission[]>>(new Map());
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Teachers & filters
  const [teachers, setTeachers] = useState<StudentOption[]>([]);
  const [selectedAssignTeacherId, setSelectedAssignTeacherId] = useState<string>(currentUser?.uid || '');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Fetch all users (students and teachers)
  useEffect(() => {
    console.log('👨‍🏫 TeacherHomework loaded, currentUser:', currentUser?.uid);
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);

        const studentsList: StudentOption[] = snapshot.docs
          .filter(d => d.id !== currentUser?.uid && (d.data().role !== 'teacher'))
          .map(d => ({ id: d.id, name: d.data().name || d.data().email || 'Unknown' }));

        const teachersList: StudentOption[] = snapshot.docs
          .filter(d => d.data().role === 'teacher')
          .map(d => ({ id: d.id, name: d.data().name || d.data().email || 'Unknown' }));

        setStudents(studentsList);
        setTeachers(teachersList);
        console.log('📚 Loaded students:', studentsList.length, 'teachers:', teachersList.length);

        if (currentUser?.uid) {
          const isTeacher = snapshot.docs.some(d => d.id === currentUser.uid && d.data().role === 'teacher');
          setSelectedAssignTeacherId(isTeacher ? currentUser.uid : (teachersList[0]?.id || currentUser.uid));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Load past homework when tab changes
  useEffect(() => {
    if (activeTab === 'past') {
      loadPastHomework();
    }
  }, [activeTab]);

  // Load submissions when check tab is active or filters change
  useEffect(() => {
    console.log('🔍 activeTab changed:', activeTab, 'filterTeacherId:', filterTeacherId, 'topic:', topicFilter);
    if (activeTab === 'check') {
      console.log('📥 Loading submissions...');
      loadSubmissions();
    }
  }, [activeTab, filterTeacherId, topicFilter]);

  const loadPastHomework = async () => {
    setLoadingPast(true);
    try {
      const homeworkCol = collection(db, 'homework');
      const q = query(homeworkCol, where('teacherId', '==', currentUser?.uid));
      const snapshot = await getDocs(q);
      const homework: HomeworkItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        studentId: doc.data().studentId,
        studentName: doc.data().studentName || 'Unknown',
        questions: doc.data().questions,
        imageUrl: doc.data().imageUrl,
        createdAt: doc.data().createdAt,
        status: doc.data().status || 'assigned',
        isActive: doc.data().isActive !== false,
        topic: doc.data().topic || ''
      }));
      setPastHomework(homework.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0));
    } catch (error) {
      console.error('Error loading past homework:', error);
    } finally {
      setLoadingPast(false);
    }
  };

  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const homeworkCol = collection(db, 'homework');
      const targetTeacher = filterTeacherId || currentUser?.uid;
      const q = query(homeworkCol, where('teacherId', '==', targetTeacher));
      const homeworkSnapshot = await getDocs(q);

      console.log('📚 Found homework assignments for teacher:', targetTeacher, homeworkSnapshot.size);

      const filteredDocs = homeworkSnapshot.docs.filter(d => {
        const data = d.data();
        // Skip explicitly deactivated homework so "Check Submissions" doesn't show them
        if (data.isActive === false) return false;
        if (!topicFilter) return true;
        const title = (data.title || '').toString().toLowerCase();
        return title.includes(topicFilter.toLowerCase());
      });

      const allSubmissions = new Map<string, StudentSubmission[]>();
      const homeworkList: HomeworkItem[] = [];

      for (const homeworkDoc of filteredDocs) {
        const homeworkId = homeworkDoc.id;
        const homeworkData = homeworkDoc.data();
        console.log(`📝 Homework: ${homeworkData.title} (ID: ${homeworkId})`);

        const submissionsCol = collection(db, 'homework', homeworkId, 'submissions');
        const submissionsSnapshot = await getDocs(submissionsCol);

        console.log(`  ✅ Found ${submissionsSnapshot.size} submission(s)`);

        const submissionsList: StudentSubmission[] = submissionsSnapshot.docs.map(doc => ({
          studentId: doc.id,
          studentName: doc.data().studentName || 'Unknown',
          answers: doc.data().answers || [],
          results: doc.data().results || [],
          lastSubmittedAt: doc.data().lastSubmittedAt,
          firstSubmittedAt: doc.data().firstSubmittedAt,
          status: doc.data().status || 'submitted'
        }));

        allSubmissions.set(homeworkId, submissionsList);

        homeworkList.push({
          id: homeworkId,
          title: homeworkData.title,
          description: homeworkData.description,
          studentId: homeworkData.studentId,
          studentName: homeworkData.studentName || 'Unknown',
          questions: homeworkData.questions,
          imageUrl: homeworkData.imageUrl,
          createdAt: homeworkData.createdAt,
          status: homeworkData.status || 'assigned',
          isActive: homeworkData.isActive !== false,
          topic: homeworkData.topic || ''
        });
      }

      console.log('📊 Total submissions loaded:', allSubmissions.size);
      setSubmissions(allSubmissions);
      setPastHomework(homeworkList.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0));
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  



  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', answer: '', note: '' }]);
  };

  const handleImageChange = (file?: File) => {
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(String(e.target?.result || ''));
    reader.readAsDataURL(file);
  };

  // Compress image client-side using canvas. Returns a Blob.
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob => {
            if (!blob) return reject(new Error('Compression failed'));
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = e => reject(e);
      const url = URL.createObjectURL(file);
      img.src = url;
    });
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0 || !title || questions.some(q => !q.question || !q.answer)) {
      alert('Please fill in all required fields (students, title, questions, and answers)');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        try {
          const compressed = await compressImage(imageFile);
          const formData = new FormData();
          formData.append('file', compressed);
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
          );
          
          if (response.ok) {
            const data = await response.json();
            imageUrl = data.secure_url;
          } else {
            console.error('Cloudinary upload failed:', response.statusText);
          }
        } catch (imgErr) {
          console.error('Image upload error:', imgErr);
        }
      }

      // Assign homework to all selected students
      for (const studentId of selectedStudentIds) {
        const student = students.find(s => s.id === studentId);
        const assignTeacherId = selectedAssignTeacherId || currentUser?.uid;
        const teacherObj = teachers.find(t => t.id === assignTeacherId);
        const homeworkRef = doc(collection(db, 'homework'));

        await setDoc(homeworkRef, {
          teacherId: assignTeacherId,
          teacherName: teacherObj?.name || currentUser?.displayName || currentUser?.email || 'Teacher',
          studentId,
          studentName: student?.name || 'Unknown',
          title,
          topic: topic || title,
          description,
          questions,
          imageUrl: imageUrl || null,
          createdAt: serverTimestamp(),
          status: 'assigned',
          isActive: true
        });
      }

      setSuccessMessage(`Homework assigned to ${selectedStudentIds.length} student(s) successfully!`);
      setTimeout(() => {
        setSuccessMessage('');
        setTitle('');
        setDescription('');
        setQuestions([{ question: '', answer: '', note: '' }]);
        setSelectedStudentIds([]);
        setImageFile(null);
        setImagePreview('');
      }, 3000);
    } catch (error) {
      console.error('Error saving homework:', error);
      alert('Error saving homework. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const duplicateHomework = (homework: HomeworkItem) => {
    setTitle(homework.title);
    setDescription(homework.description || '');
    setQuestions(homework.questions);
    setSelectedStudentIds([homework.studentId]);
    setActiveTab('assign');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleHomeworkActive = async (homeworkId: string) => {
    try {
      const homework = pastHomework.find(h => h.id === homeworkId);
      if (homework) {
        await updateDoc(doc(db, 'homework', homeworkId), {
          isActive: !homework.isActive
        });
        await loadPastHomework();
      }
    } catch (error) {
      console.error('Error toggling homework status:', error);
    }
  };

  const deleteHomework = async (homeworkId: string) => {
    if (confirm('Are you sure you want to delete this homework?')) {
      try {
        await updateDoc(doc(db, 'homework', homeworkId), {
          status: 'deleted',
          isActive: false
        });
        await loadPastHomework();
        setSuccessMessage('Homework deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting homework:', error);
      }
    }
  };

  const toggleTopicActive = async (topic: string, setActive: boolean) => {
    if (!confirm(`Are you sure you want to ${setActive ? 'activate' : 'deactivate'} all homework in "${topic}"?`)) return;
    try {
      setGroupLoading(true);
      const toUpdate = pastHomework.filter(h => ((h.topic || 'General').trim() || 'General') === (topic || 'General'));
      await Promise.all(toUpdate.map(h => updateDoc(doc(db, 'homework', h.id), { isActive: setActive })));
      await loadPastHomework();
      setSuccessMessage(`Group ${setActive ? 'activated' : 'deactivated'}: ${topic}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error toggling topic group:', err);
    } finally {
      setGroupLoading(false);
    }
  };

  const toggleTopicExpanded = (topic: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  if (!currentUser) {
    return <div className="p-6 text-center text-gray-400">Please log in as teacher</div>;
  }

  return (
    <div className="w-full bg-black text-white p-6 overflow-y-auto max-h-full">
      {/* Header with Tabs */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Teacher Homework Management</h2>
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('assign')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'assign'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus size={20} /> Assign Homework
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'past'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Archive size={20} /> Past Homework
          </button>
          <button
            onClick={() => setActiveTab('check')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'check'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle size={20} /> Check Submissions
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-900 border border-green-600 rounded-lg mb-6 text-green-300">
          {successMessage}
        </div>
      )}

      {/* ASSIGN HOMEWORK TAB */}
      {activeTab === 'assign' && (
        <div>
          {/* Multi-Student Selection with Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
              <Users size={18} /> Select Students (Multiple)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700 max-h-64 overflow-y-auto">
              {students.map(student => (
                <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="w-4 h-4"
                  />
                  <span>{student.name}</span>
                </label>
              ))}
            </div>
            {selectedStudentIds.length > 0 && (
              <div className="mt-2 text-sm text-blue-400">
                {selectedStudentIds.length} student(s) selected
              </div>
            )}
          </div>

            {/* Assigning Teacher */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Assigning Teacher</label>
              <select
                value={selectedAssignTeacherId}
                onChange={e => setSelectedAssignTeacherId(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
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

          {/* Topic */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Topic (grouping)</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Math, Science"
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

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Image (optional)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageChange(e.target.files ? e.target.files[0] : undefined)}
                className="text-sm"
              />
              {imagePreview && (
                <button
                  onClick={() => handleImageChange(undefined)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            {imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="preview" className="max-w-xs rounded" />
              </div>
            )}
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
            {uploading ? 'Uploading...' : `Assign to ${selectedStudentIds.length} Student(s)`}
          </button>
        </div>
      )}

      {/* PAST HOMEWORK TAB */}
      {activeTab === 'past' && (
        <div>
          {loadingPast ? (
            <div className="text-center text-gray-400">Loading past homework...</div>
          ) : pastHomework.length === 0 ? (
            <div className="text-center text-gray-400">No homework assigned yet</div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const topicMap = new Map<string, HomeworkItem[]>();
                for (const h of pastHomework.filter(h => h.status !== 'deleted')) {
                  const key = (h.topic || 'General').trim() || 'General';
                  const arr = topicMap.get(key) || [];
                  arr.push(h);
                  topicMap.set(key, arr);
                }

                const topics = Array.from(topicMap.entries()).map(([topic, list]) => ({ topic, list }));

                return (
                  <div className="space-y-4">
                    {topics.map(t => {
                      const isExpanded = expandedTopics.has(t.topic);
                      return (
                        <div key={t.topic} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <button
                              onClick={() => toggleTopicExpanded(t.topic)}
                              className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                            >
                              <ChevronDown
                                size={20}
                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                              />
                              <div>
                                <h3 className="text-lg font-semibold">{t.topic}</h3>
                                <p className="text-sm text-gray-400">{t.list.length} assignment(s)</p>
                              </div>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleTopicActive(t.topic, !t.list.some(h => h.isActive))}
                                disabled={groupLoading}
                                className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded disabled:opacity-50"
                              >
                                {t.list.some(h => h.isActive) ? 'Deactivate Group' : 'Activate Group'}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 mt-3">
                              {t.list.map(homework => (
                                <div key={homework.id} className={`p-3 rounded border ${homework.isActive ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-600 opacity-70'}`}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold text-white">{homework.title}</h4>
                                      <p className="text-xs text-gray-400">Student: <span className="text-blue-400">{homework.studentName}</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => toggleHomeworkActive(homework.id)}
                                        className={`p-2 rounded transition-colors ${homework.isActive ? 'bg-green-900 hover:bg-green-800 text-green-300' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                        title={homework.isActive ? 'Deactivate' : 'Activate'}
                                      >
                                        <ToggleLeft size={18} />
                                      </button>
                                      <button
                                        onClick={() => duplicateHomework(homework)}
                                        className="p-2 bg-blue-900 hover:bg-blue-800 text-blue-300 rounded transition-colors"
                                        title="Duplicate & Edit"
                                      >
                                        <Copy size={18} />
                                      </button>
                                      <button
                                        className="p-2 bg-purple-900 hover:bg-purple-800 text-purple-300 rounded transition-colors"
                                        title="View Details"
                                        disabled
                                      >
                                        <Eye size={18} />
                                      </button>
                                      <button
                                        onClick={() => deleteHomework(homework.id)}
                                        className="p-2 bg-red-900 hover:bg-red-800 text-red-300 rounded transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* CHECK SUBMISSIONS TAB */}
      {activeTab === 'check' && (
        <div>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <div>
              <label className="block text-xs text-gray-400">Filter by Teacher</label>
              <select
                value={filterTeacherId}
                onChange={e => setFilterTeacherId(e.target.value)}
                className="p-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="">(All teachers)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400">Filter by Topic / Title</label>
              <input
                type="text"
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                placeholder="Search title"
                className="p-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
          </div>
          {loadingSubmissions ? (
            <div className="text-center text-gray-400">Loading submissions...</div>
          ) : pastHomework.length === 0 ? (
            <div className="text-center text-gray-400">No homework assigned yet</div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const topicMap = new Map<string, HomeworkItem[]>();
                for (const h of pastHomework.filter(h => h.status !== 'deleted' && h.isActive)) {
                  const key = (h.topic || 'General').trim() || 'General';
                  const arr = topicMap.get(key) || [];
                  arr.push(h);
                  topicMap.set(key, arr);
                }

                const topics = Array.from(topicMap.entries()).map(([topic, list]) => ({ topic, list }));

                return (
                  <div className="space-y-4">
                    {topics.map(t => {
                      const total = t.list.length;
                      const completed = t.list.filter(h => h.status === 'completed').length;
                      const pending = total - completed;

                      return (
                        <div key={t.topic} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{t.topic}</h3>
                              <p className="text-sm text-gray-400">{total} assignment(s)</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-gray-300">Completed: <span className="text-green-300">{completed}</span></div>
                              <div className="text-sm text-gray-300">Pending: <span className="text-yellow-300">{pending}</span></div>
                              <button
                                onClick={() => setSelectedTopic(selectedTopic === t.topic ? null : t.topic)}
                                className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-blue-300 rounded"
                              >
                                {selectedTopic === t.topic ? 'Hide' : 'View Submissions'}
                              </button>
                            </div>
                          </div>

                          {selectedTopic === t.topic && (
                            <div className="divide-y divide-gray-700">
                              {t.list.map(homework => {
                                const hwSubs = submissions.get(homework.id) || [];

                                return (
                                  <div key={homework.id} className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-semibold text-white">{homework.title} — {homework.studentName}</h4>
                                        <p className="text-xs text-gray-400">{homework.createdAt?.toDate?.()?.toLocaleString?.() || 'Date unknown'}</p>
                                      </div>
                                      <div className="text-sm text-gray-400">{hwSubs.length} submission(s)</div>
                                    </div>

                                    {hwSubs.length === 0 ? (
                                      <div className="text-sm text-gray-500">No submissions yet</div>
                                    ) : (
                                      <div className="space-y-2">
                                        {hwSubs.map(sub => (
                                          <div key={sub.studentId} className="p-2 bg-gray-700 rounded flex items-center justify-between">
                                            <div>
                                              <div className="font-semibold text-blue-300">{sub.studentName}</div>
                                              <div className="text-xs text-gray-400">Submitted: {sub.lastSubmittedAt?.toDate?.()?.toLocaleString?.() || 'Unknown'}</div>
                                            </div>
                                            <div className="text-sm text-gray-300">{sub.results.length > 0 ? `${sub.results.filter(r=>r.isCorrect).length}/${sub.results.length}` : '-'}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
