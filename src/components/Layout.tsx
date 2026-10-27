import React from 'react';
import { 
  LayoutDashboard, 
  MonitorPlay, 
  Monitor, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarDays, 
  ClipboardCheck, 
  FileSpreadsheet, 
  Bell, 
  Settings 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'classrooms', label: 'Live Classrooms', icon: MonitorPlay },
  { id: 'boards', label: 'Digital Boards', icon: Monitor },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'classes', label: 'Classes', icon: Users },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'attendance', label: 'Attendance Monitor', icon: ClipboardCheck },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-wider text-blue-400">SAAM</h1>
          <p className="text-xs text-slate-400 mt-1">Institute Control Center</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center">
              DEMO MODE
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
