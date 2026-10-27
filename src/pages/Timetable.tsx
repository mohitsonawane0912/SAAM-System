import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { Settings, Plus, X, Calendar, Monitor } from 'lucide-react';

export default function Timetable() {
  const [config, setConfig] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  // Form states
  const [newEntry, setNewEntry] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    subject_id: '',
    teacher_id: '',
    class_id: ''
  });

  const loadData = () => {
    fetch('/api/timetable/config').then(res => res.json()).then(setConfig);
    fetch('/api/timetable').then(res => res.json()).then(setEntries);
    fetch('/api/teachers').then(res => res.json()).then(data => {
      setTeachers(data);
      if (data.length > 0) setNewEntry(prev => ({...prev, teacher_id: data[0].id}));
    });
    
    fetch('/api/boards').then(res => res.json()).then(boards => {
      // Boards represent our rooms natively via LAN pair now
      const rooms = boards.map((b: any) => ({ id: b.classroom_id, name: b.name.replace(' Digital Board', '') }));
      const uniqueRooms = rooms.filter((v:any,i:any,a:any)=>a.findIndex((v2:any)=>(v2.id===v.id))===i);
      setClassrooms(uniqueRooms);
      if (uniqueRooms.length > 0 && !selectedRoom) {
        setSelectedRoom(uniqueRooms[0].id);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, [selectedRoom]); // Also handle selection update fallback

  const handleSaveConfig = async (e: any) => {
    e.preventDefault();
    await fetch('/api/timetable/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    setShowConfig(false);
    loadData();
  };

  const handleAddEntry = async (e: any) => {
    e.preventDefault();
    const id = `tt_${Date.now()}`;
    await fetch('/api/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, classroom_id: selectedRoom, ...newEntry })
    });
    setShowAdd(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (!config) return <div className="p-10 text-gray-500">Loading...</div>;

  const roomEntries = entries.filter(e => e.classroom_id === selectedRoom);
  const selectedRoomName = classrooms.find(c => c.id === selectedRoom)?.name || 'Unknown Room';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Timetable</h2>
          <p className="text-gray-500 mt-1">Manage the schedule rotation for specific digital boards.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowConfig(true)}>
            <Settings size={16} className="mr-2" /> Configuration
          </Button>
          <Button onClick={() => setShowAdd(true)} disabled={!selectedRoom}>
            <Plus size={16} className="mr-2" /> Schedule Lecture
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
        <Monitor className="text-blue-600" />
        <label className="font-medium text-gray-700">Select Digital Board (Room):</label>
        <select 
          value={selectedRoom} 
          onChange={e => setSelectedRoom(e.target.value)}
          className="p-2 border border-gray-300 rounded-md bg-gray-50 min-w-[200px]"
        >
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          {classrooms.length === 0 && <option value="">No boards paired yet</option>}
        </select>
      </div>

      {showConfig && (
        <Card className="p-6 bg-gray-50 border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Timetable Configuration</h3>
            <button onClick={() => setShowConfig(false)}><X size={20} className="text-gray-500" /></button>
          </div>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="time" value={config.start_time} onChange={e => setConfig({...config, start_time: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input type="time" value={config.end_time} onChange={e => setConfig({...config, end_time: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slot Duration (mins)</label>
                <input type="number" value={config.slot_duration} onChange={e => setConfig({...config, slot_duration: parseInt(e.target.value)})} className="w-full p-2 border rounded" />
              </div>
            </div>
            <Button type="submit">Save Configuration</Button>
          </form>
        </Card>
      )}

      {showAdd && (
        <Card className="p-6 bg-blue-50 border-blue-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900">Add Lecture to {selectedRoomName}</h3>
            <button onClick={() => setShowAdd(false)}><X size={20} className="text-blue-500" /></button>
          </div>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Day</label>
                <select value={newEntry.day_of_week} onChange={e => setNewEntry({...newEntry, day_of_week: e.target.value})} className="w-full p-2 border rounded bg-white">
                  {config.days.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start</label>
                <input type="time" value={newEntry.start_time} onChange={e => setNewEntry({...newEntry, start_time: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End</label>
                <input type="time" value={newEntry.end_time} onChange={e => setNewEntry({...newEntry, end_time: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Teacher</label>
                <select value={newEntry.teacher_id} onChange={e => setNewEntry({...newEntry, teacher_id: e.target.value})} className="w-full p-2 border rounded bg-white">
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.department})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input type="text" required value={newEntry.subject_id} onChange={e => setNewEntry({...newEntry, subject_id: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Math 101" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Class / Year</label>
                <input type="text" required value={newEntry.class_id} onChange={e => setNewEntry({...newEntry, class_id: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Year 1" />
              </div>
            </div>
            <Button type="submit">Add to Schedule</Button>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 bg-slate-800 text-white font-medium flex items-center justify-between">
          <span>{selectedRoomName} - Weekly Schedule</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {config.days.map((day: string) => (
                  <th key={day} className="p-4 font-medium border-b border-r border-slate-200 text-center w-1/5">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                {config.days.map((day: string) => (
                  <td key={day} className="p-4 border-r border-gray-200 align-top h-64">
                    <div className="space-y-3">
                      {roomEntries.filter(e => e.day_of_week === day).sort((a,b) => a.start_time.localeCompare(b.start_time)).map(entry => (
                        <div key={entry.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 shadow-sm hover:border-blue-300 transition-colors group relative">
                          <button onClick={() => handleDelete(entry.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                          <div className="text-xs font-bold text-blue-600 mb-1">{entry.start_time} - {entry.end_time}</div>
                          <div className="font-semibold text-gray-900">{entry.subject_name || entry.subject_id}</div>
                          <div className="text-xs text-gray-500 mt-1">{entry.teacher_name || entry.teacher_id}</div>
                          <div className="text-xs text-gray-500">{entry.class_name || entry.class_id}</div>
                        </div>
                      ))}
                      {roomEntries.filter(e => e.day_of_week === day).length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-4 italic">Free Slot</div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
