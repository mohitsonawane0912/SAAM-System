import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Badge, Button } from '../components/ui';

export default function ClassroomDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);

  useEffect(() => {
    // In a real app we'd fetch details specifically for this room.
    // For V1 prototype, we'll fetch all live classrooms and find this one.
    fetch('/api/classrooms/live')
      .then(res => res.json())
      .then(rooms => {
        const room = rooms.find((r: any) => r.classroom_id === id);
        setData(room);
      });
      
    // Fetch timetable allocated to this classroom
    fetch('/api/timetable')
      .then(res => res.json())
      .then(entries => {
        setTimetable(entries.filter((e: any) => e.classroom_id === id));
      });
  }, [id]);

  if (!data) return <div className="p-10 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{data.room_name} Control</h2>
          <p className="text-gray-500 mt-1">Live management and override controls.</p>
        </div>
        <div className="flex gap-2">
          {data.session_id && (
            <Button variant="danger">Force End Session</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6 space-y-6">
          <h3 className="text-lg font-bold border-b pb-2">Current Lecture</h3>
          {data.session_id ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-semibold text-gray-900">{data.subject_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teacher</p>
                  <p className="font-semibold text-gray-900">{data.teacher_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-semibold text-gray-900">{data.class_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Session Status</p>
                  <Badge variant={data.session_status === 'FINAL_VERIFICATION' ? 'warning' : 'success'}>
                    {data.session_status}
                  </Badge>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h4 className="font-semibold mb-3">Live Attendance Sync</h4>
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{data.present_count}</p>
                    <p className="text-xs text-gray-500 uppercase">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">{data.pending_count}</p>
                    <p className="text-xs text-gray-500 uppercase">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{data.absent_count}</p>
                    <p className="text-xs text-gray-500 uppercase">Absent</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-10 text-center">No active lecture currently scheduled.</p>
          )}
        </Card>

        <Card className="p-6 space-y-4 bg-gray-50">
          <h3 className="text-lg font-bold border-b pb-2">Hardware Status</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Digital Board</p>
              {data.board_status === 'CONNECTED' ? (
                <Badge variant="success">CONNECTED</Badge>
              ) : (
                <Badge variant="danger">OFFLINE</Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Camera Feed</p>
              {data.board_status === 'CONNECTED' ? (
                <Badge variant="success">ACTIVE</Badge>
              ) : (
                <Badge variant="danger">UNAVAILABLE</Badge>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full">Restart Board App</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Timetable Allocation for this Room */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Timetable Allocation</h3>
        {timetable.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetable.sort((a,b) => {
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
              if(days.indexOf(a.day_of_week) !== days.indexOf(b.day_of_week)) return days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week);
              return a.start_time.localeCompare(b.start_time);
            }).map(slot => (
              <div key={slot.id} className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                <div className="font-bold text-blue-900 mb-1">{slot.day_of_week}</div>
                <div className="text-sm font-semibold text-blue-700">{slot.start_time} - {slot.end_time}</div>
                <div className="mt-2 text-sm text-gray-700">Subject: <span className="font-medium">{slot.subject_name || slot.subject_id}</span></div>
                <div className="text-sm text-gray-700">Teacher: <span className="font-medium">{slot.teacher_name || slot.teacher_id}</span></div>
                <div className="text-sm text-gray-700">Class: <span className="font-medium">{slot.class_name || slot.class_id}</span></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No scheduled lectures allocated to this room.</p>
        )}
      </Card>

    </div>
  );
}
