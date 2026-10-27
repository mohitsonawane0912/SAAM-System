import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { Wifi, X } from 'lucide-react';

export default function Boards() {
  const [boards, setBoards] = useState<any[]>([]);
  const [showPair, setShowPair] = useState(false);
  const [pairData, setPairData] = useState({ room_name: '', otp: '' });

  const loadData = () => {
    fetch('/api/boards').then(res => res.json()).then(setBoards);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePair = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/boards/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pairData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setShowPair(false);
      setPairData({ room_name: '', otp: '' });
      alert('Digital Board successfully paired via LAN OTP!');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Digital Boards (Rooms)</h2>
          <p className="text-gray-500 mt-1">Manage fixed digital boards paired via local LAN network.</p>
        </div>
        <Button onClick={() => setShowPair(true)}>
          <Wifi size={16} className="mr-2" /> Connect Board via LAN OTP
        </Button>
      </div>

      {showPair && (
        <Card className="p-6 bg-blue-50 border-blue-100 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-900">Connect New Digital Board</h3>
            <button onClick={() => setShowPair(false)}><X size={20} className="text-blue-500" /></button>
          </div>
          <form onSubmit={handlePair} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Classroom Name</label>
              <input required type="text" value={pairData.room_name} onChange={e => setPairData({...pairData, room_name: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Room 101" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">LAN OTP</label>
              <input required type="text" value={pairData.otp} onChange={e => setPairData({...pairData, otp: e.target.value})} className="w-full p-2 border rounded font-mono text-lg tracking-widest text-center" placeholder="• • • • • •" maxLength={6} />
              <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code currently displayed on the digital board screen over LAN.</p>
            </div>
            <Button type="submit" className="w-full">Connect & Pair Board</Button>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Room / Board Name</th>
                <th className="px-6 py-4 font-medium">Board ID</th>
                <th className="px-6 py-4 font-medium">LAN Status</th>
                <th className="px-6 py-4 font-medium">Last Heartbeat</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {boards.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{b.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{b.id}</td>
                  <td className="px-6 py-4">
                    <Badge variant={b.status === 'CONNECTED' ? 'success' : 'danger'}>
                      {b.status === 'CONNECTED' ? 'LAN CONNECTED' : 'OFFLINE'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(b.last_heartbeat).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm">Manage</Button>
                  </td>
                </tr>
              ))}
              {boards.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No digital boards paired yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
