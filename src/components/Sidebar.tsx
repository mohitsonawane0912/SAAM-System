import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Users, BookOpen, Clock, FileText, Settings, Bell, Server, CalendarDays } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Live Classrooms', icon: MonitorPlay, path: '/classrooms' },
  { name: 'Digital Boards', icon: Server, path: '/boards' },
  { name: 'Students', icon: Users, path: '/students' },
  { name: 'Teachers', icon: BookOpen, path: '/teachers' },
  { name: 'Timetable', icon: CalendarDays, path: '/timetable' },
  { name: 'Reports', icon: FileText, path: '/reports' },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-xs">S</span>
          SAAM
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors " +
                  (isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white")
                }
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white">
            AD
          </div>
          <div>
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
