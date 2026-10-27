/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Classrooms from './pages/Classrooms';
import ClassroomDetail from './pages/ClassroomDetail';
import Boards from './pages/Boards';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Timetable from './pages/Timetable';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/classrooms" element={<Classrooms />} />
              <Route path="/classrooms/:id" element={<ClassroomDetail />} />
              <Route path="/boards" element={<Boards />} />
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
