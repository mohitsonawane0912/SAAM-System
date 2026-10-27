import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { Monitor, Users, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/classrooms/live').then(res => res.json()).then(setClassrooms);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Live Classrooms</h2>
        <p className="text-gray-500 mt-1">Monitor all active sessions across the institution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((c) => (
          <Card key={c.classroom_id} className="flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{c.room_name}</h3>
                {c.session_id ? (
                  <p className="text-sm font-medium text-gray-600 mt-1">{c.subject_name} • {c.class_name}</p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">No Active Lecture</p>
                )}
              </div>
              {c.session_id && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                  LIVE
                </div>
              )}
            </div>

            <div className="p-5 flex-1 space-y-4">
              {c.session_id ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} />
                    <span>Teacher: <strong>{c.teacher_name}</strong></span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Present</p>
                      <p className="text-xl font-bold text-emerald-600 mt-1">{c.present_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Pending</p>
                      <p className="text-xl font-bold text-orange-500 mt-1">{c.pending_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Absent</p>
                      <p className="text-xl font-bold text-red-600 mt-1">{c.absent_count}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center py-6 text-gray-400 text-sm">
                  Waiting for scheduled timetable slot...
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Monitor size={16} /> Board
                </span>
                {c.board_status === 'CONNECTED' ? (
                  <Badge variant="success">CONNECTED</Badge>
                ) : (
                  <Badge variant="danger">OFFLINE</Badge>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Video size={16} /> Camera
                </span>
                {c.board_status === 'CONNECTED' ? (
                  <Badge variant="success">CONNECTED</Badge>
                ) : (
                  <Badge variant="danger">OFFLINE</Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => navigate(`/classrooms/${c.classroom_id}`)}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
