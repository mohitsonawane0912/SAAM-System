import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { UserPlus, X, MapPin, Search, Filter } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', roll_number: '', class_id: '', image_url: '' });

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('All');

  const loadData = () => {
    fetch('/api/students').then(res => res.json()).then(setStudents);
    fetch('/api/classes').then(res => res.json()).then(data => {
      setClasses(data);
      if (data.length > 0) setNewStudent(prev => ({...prev, class_id: data[0].id}));
    });
    fetch('/api/boards').then(res => res.json()).then(boards => {
      const rooms = boards.map((b: any) => b.classroom_name).filter(Boolean);
      const uniqueRooms = Array.from(new Set(rooms));
      setAvailableRooms(uniqueRooms as string[]);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudent(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!newStudent.image_url) {
      alert("Please upload a passport-sized image for the student.");
      return;
    }
    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    });
    setShowAdd(false);
    setNewStudent(prev => ({ ...prev, name: '', roll_number: '', image_url: '' }));
    loadData();
  };

  // Compute filtered students
  const filteredStudents = students.filter(s => {
    const safeName = String(s.name || '').toLowerCase();
    const safeRoll = String(s.roll_number || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = safeName.includes(searchLower) || safeRoll.includes(searchLower);
    
    // Check if the student's scheduled rooms match the selected room
    let matchesRoom = true;
    if (selectedRoomFilter !== 'All') {
      const studentRooms = s.rooms ? s.rooms : [];
      
      // Clean both the selected filter and the student's rooms so they can match reliably
      // E.g. "Room 101" vs "101", "101 Digital Board" vs "101"
      const normalizeRoomName = (name: string) => name.replace(/digital board/i, '').replace(/room/i, '').trim();
      
      const normalizedFilter = normalizeRoomName(selectedRoomFilter);
      const normalizedStudentRooms = studentRooms.map((r: string) => normalizeRoomName(r));

      matchesRoom = normalizedStudentRooms.includes(normalizedFilter);
    }
    
    return matchesSearch && matchesRoom;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Directory & Enrollment</h2>
          <p className="text-gray-500 mt-1">Manage student face enrollment, profiles, and active lecture room allocations.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus size={16} className="mr-2" /> Add Student
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="py-2 pl-3 pr-8 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Rooms</option>
            {availableRooms.map((room: string) => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>
      </div>

      {showAdd && (
        <Card className="p-6 bg-blue-50 border-blue-100 max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900">Enroll New Student</h3>
            <button onClick={() => setShowAdd(false)}><X size={20} className="text-blue-500" /></button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Roll Number</label>
                <input required type="text" value={newStudent.roll_number} onChange={e => setNewStudent({...newStudent, roll_number: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. CS101" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select value={newStudent.class_id} onChange={e => setNewStudent({...newStudent, class_id: e.target.value})} className="w-full p-2 border rounded bg-white">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium mb-1">Passport Image (for Face Recognition)</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full p-2 border rounded bg-white text-sm" />
                  {newStudent.image_url && (
                    <img src={newStudent.image_url} alt="Preview" className="h-12 w-12 rounded object-cover border border-gray-200" />
                  )}
                </div>
              </div>
            </div>
            <Button type="submit">Enroll Student</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map(s => (
          <Card key={s.id} className="overflow-hidden flex flex-col">
            <div className="h-48 bg-gray-100 flex items-center justify-center relative border-b">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 font-medium">No Image</div>
              )}
              <div className="absolute top-2 right-2">
                {s.face_enrolled ? (
                  <Badge variant="success" className="shadow-sm">Face Enrolled</Badge>
                ) : (
                  <Badge variant="warning" className="shadow-sm">Pending Scan</Badge>
                )}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">{s.name}</h3>
              <p className="text-sm text-gray-500 font-mono mt-1">Roll No: {s.roll_number}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default" className="bg-blue-50 text-blue-700">{s.class_name}</Badge>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1">
                    <MapPin size={14} /> Scheduled Lecture Rooms
                  </p>
                  {s.rooms && s.rooms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {s.rooms.map((room: string) => (
                        <span key={room} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {room.replace(' Digital Board', '')}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No rooms scheduled</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredStudents.length === 0 && !showAdd && (
          <div className="col-span-full py-10 text-center text-gray-500">
            {students.length === 0 ? "No students found. Add one to get started." : "No students match your search criteria."}
          </div>
        )}
      </div>
    </div>
  );
}
