import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { MonitorPlay, Users, Server, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(res => res.json()).then(setData);

    // Basic SSE setup for real-time monitoring
    const es = new EventSource('/api/realtime');
    es.onmessage = (e) => {
      // In a real app, parse event and update state
      console.log('Realtime Event:', e.data);
    };
    return () => es.close();
  }, []);

  if (!data) return <div className="p-10 flex justify-center text-gray-500">Loading Dashboard...</div>;

  const stats = [
    { name: 'Total Classrooms', value: data.totalClassrooms, icon: Server, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Active Lectures', value: data.activeLectures, icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Connected Boards', value: `${data.connectedBoards} / ${data.totalBoards}`, icon: Server, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Pending Verification', value: data.pendingVerification, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const handleDemoScan = async () => {
    await fetch('/api/demo/scan', { method: 'POST' });
    fetch('/api/dashboard').then(res => res.json()).then(setData);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Good Morning, Administrator</h2>
          <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="warning" className="px-3 py-1 text-sm font-semibold uppercase tracking-wide">
            Demo Mode
          </Badge>
          <Button variant="outline" onClick={handleDemoScan}>Simulate Recognition Scan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6 flex items-start gap-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {data.totalBoards > data.connectedBoards && (
        <Card className="p-4 border-red-200 bg-red-50 flex flex-row items-center gap-4">
          <div className="bg-red-100 text-red-600 p-2 rounded-full">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-red-900">Device Offline Alert</h4>
            <p className="text-sm text-red-700">Room 103 Digital Board has lost connection. Last heartbeat 10 minutes ago.</p>
          </div>
          <div className="ml-auto">
            <Button variant="danger" size="sm">Investigate</Button>
          </div>
        </Card>
      )}
      
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Institution Overview</h3>
        <Card className="p-6 h-64 flex items-center justify-center bg-gray-50 border-dashed">
          <p className="text-gray-500">Live attendance chart visualization goes here for V2</p>
        </Card>
      </div>
    </div>
  );
}
