import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { Users, BookOpen, X } from 'lucide-react';

export default function Teachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', department: '', employee_id: '' });

  const loadData = () => {
    fetch('/api/teachers').then(res => res.json()).then(setTeachers);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher)
    });
    setShowAdd(false);
    setNewTeacher({ name: '', department: '', employee_id: '' });
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teaching Staff</h2>
          <p className="text-gray-500 mt-1">Manage educators, their departments, and currently assigned years/classes.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>Add Teacher</Button>
      </div>

      {showAdd && (
        <Card className="p-6 bg-blue-50 border-blue-100 max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900">Add New Teacher</h3>
            <button onClick={() => setShowAdd(false)}><X size={20} className="text-blue-500" /></button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required type="text" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <input required type="text" value={newTeacher.department} onChange={e => setNewTeacher({...newTeacher, department: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Science" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <input required type="text" value={newTeacher.employee_id} onChange={e => setNewTeacher({...newTeacher, employee_id: e.target.value})} className="w-full p-2 border rounded" />
              </div>
            </div>
            <Button type="submit">Save Teacher</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(teacher => (
          <Card key={teacher.id} className="p-6">
            <div className="flex items-start justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{teacher.name}</h3>
                  <p className="text-sm text-gray-500">ID: {teacher.employee_id}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                  <BookOpen size={14}/> Department
                </p>
                <p className="text-sm font-medium text-gray-900">{teacher.department}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1">
                  <Users size={14}/> Assigned Years & Classes
                </p>
                {teacher.teaching_classes?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {teacher.teaching_classes.map((cls: string) => (
                      <Badge key={cls} variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
                        {cls}
                      </Badge>
                    ))}
                    {teacher.teaching_years.map((yr: string) => (
                      <Badge key={yr} variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Year {yr}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No classes scheduled</p>
                )}
              </div>
            </div>
          </Card>
        ))}
        {teachers.length === 0 && !showAdd && (
          <div className="col-span-full py-10 text-center text-gray-500">No teachers found. Add one to get started.</div>
        )}
      </div>
    </div>
  );
}
