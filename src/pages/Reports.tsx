import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/auth';

import type { User } from 'firebase/auth';

export default function Reports() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, t) => {
        setUser(user);
        setToken(t);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setToken(null);
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/cancelled-popup-request') {
        alert('Sign in was cancelled or blocked. Please ensure popups are allowed and try again.');
      } else {
        alert('Sign in failed: ' + e.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExport = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      // 1. Fetch detailed room data
      const res = await fetch('/api/reports/detailed');
      const roomData = await res.json();
      
      // 2. Prepare sheets to create
      const sheets = [
        { properties: { title: "Unified Overview" } }
      ];
      
      roomData.forEach((room: any) => {
        sheets.push({ properties: { title: room.room_name } });
      });

      // 3. Create the Spreadsheet with multiple tabs
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `SAAM Attendance Report - ${new Date().toLocaleDateString()}`
          },
          sheets: sheets
        })
      });
      const sheetInfo = await createRes.json();
      
      if (sheetInfo.spreadsheetId) {
        const spreadsheetId = sheetInfo.spreadsheetId;
        
        // 4. Fetch unified live data for the overview sheet
        const liveRes = await fetch('/api/classrooms/live');
        const liveData = await liveRes.json();
        const overviewRecords = liveData.map((d: any) => [
          d.room_name, d.subject_name, d.teacher_name, 
          d.class_name, d.session_status, d.present_count, 
          d.pending_count, d.absent_count
        ]);

        // 5. Build batch update request for all sheets
        const data = [];
        
        // Overview data
        data.push({
          range: "'Unified Overview'!A1:H100",
          majorDimension: "ROWS",
          values: [
            ['Room', 'Subject', 'Teacher', 'Class', 'Status', 'Present', 'Pending', 'Absent'],
            ...overviewRecords
          ]
        });
        
        // Individual room data
        roomData.forEach((room: any) => {
          const roomRecords = room.records.map((r: any) => [
            r.student_name, r.status, r.previous_record
          ]);
          data.push({
            range: `'${room.room_name}'!A1:C500`,
            majorDimension: "ROWS",
            values: [
              ['Student Name', 'Attendance', 'Previous Record'],
              ...roomRecords
            ]
          });
        });
        
        // 6. Execute batch update
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: data
          })
        });
        
        setExportUrl(sheetInfo.spreadsheetUrl);
      }
    } catch (e) {
      console.error(e);
      alert('Export failed. Check console for details.');
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
        <p className="text-gray-500 mt-1">Generate and export official institution attendance records.</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Export to Google Sheets</h3>
        
        {needsAuth ? (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100">
              <ShieldCheck className="text-blue-500" size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Sign in to Export</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Connect your Google Account to export reports directly to Google Sheets with your permission.
              </p>
            </div>
            <button onClick={handleLogin} disabled={isLoggingIn} className="gsi-material-button bg-white border border-gray-300 rounded shadow-sm px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors mx-auto disabled:opacity-50">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700 font-roboto">Sign in with Google</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <FileText className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900">Connected to Google Sheets</h4>
                <p className="text-sm text-emerald-700">Signed in as {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={logout}>Sign Out</Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export Current Overview'}
              </Button>
            </div>
          </div>
        )}

        {exportUrl && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <p className="text-blue-800 font-medium text-sm">Report exported successfully!</p>
            <a href={exportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800">
              Open Google Sheet <ExternalLink size={16} />
            </a>
          </div>
        )}
      </Card>
      
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Available System Reports</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
            <div>
              <h4 className="font-semibold text-gray-900">Daily Institution Summary</h4>
              <p className="text-sm text-gray-500">Overview of all lectures and total attendance.</p>
            </div>
            <Button variant="outline" size="sm">Preview</Button>
          </Card>
          <Card className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
            <div>
              <h4 className="font-semibold text-gray-900">Defaulter List (Last 30 Days)</h4>
              <p className="text-sm text-gray-500">Students below 75% attendance criteria.</p>
            </div>
            <Button variant="outline" size="sm">Preview</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
