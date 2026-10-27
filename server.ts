import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cors from 'cors';

const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up SQLite DB
let db: any;
function setupDb() {
  db = new Database('./saam-database.sqlite');
  db.pragma('foreign_keys = ON');

  // Create tables for V1
  db.exec(`
    
    CREATE TABLE IF NOT EXISTS timetable_config (
      id TEXT PRIMARY KEY,
      days TEXT,
      start_time TEXT,
      end_time TEXT,
      slot_duration INTEGER
    );
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY,
      day_of_week TEXT,
      start_time TEXT,
      end_time TEXT,
      classroom_id TEXT,
      subject_id TEXT,
      teacher_id TEXT,
      class_id TEXT,
      FOREIGN KEY(classroom_id) REFERENCES classrooms(id)
    );
CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY,
      name TEXT,
      status TEXT,
      capacity INTEGER
    );
    CREATE TABLE IF NOT EXISTS digital_boards (
      id TEXT PRIMARY KEY,
      name TEXT,
      classroom_id TEXT,
      status TEXT,
      last_heartbeat TEXT,
      software_version TEXT,
      FOREIGN KEY(classroom_id) REFERENCES classrooms(id)
    );
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT,
      employee_id TEXT,
      department TEXT
    );
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT
    );
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT,
      year TEXT,
      department TEXT
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      roll_number TEXT,
      name TEXT,
      class_id TEXT,
      face_enrolled BOOLEAN,
      image_url TEXT,
      FOREIGN KEY(class_id) REFERENCES classes(id)
    );
    CREATE TABLE IF NOT EXISTS lecture_sessions (
      id TEXT PRIMARY KEY,
      classroom_id TEXT,
      subject_id TEXT,
      teacher_id TEXT,
      class_id TEXT,
      status TEXT,
      start_time TEXT,
      end_time TEXT
    );
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      student_id TEXT,
      status TEXT,
      verification_time TEXT,
      confidence REAL,
      FOREIGN KEY(session_id) REFERENCES lecture_sessions(id),
      FOREIGN KEY(student_id) REFERENCES students(id)
    );
  `);
  
  // Seed initial data if empty
  const hasClassrooms = db.prepare('SELECT count(*) as count FROM classrooms').get();
  if (hasClassrooms.count === 0) {
    db.prepare("INSERT INTO classrooms (id, name, status, capacity) VALUES ('c1', 'Room 101', 'ACTIVE', 60), ('c2', 'Room 102', 'ACTIVE', 50), ('c3', 'Room 103', 'ACTIVE', 60)").run();
    db.prepare("INSERT INTO digital_boards (id, name, classroom_id, status, last_heartbeat, software_version) VALUES ('b1', 'Board-101', 'c1', 'CONNECTED', datetime('now'), 'v1.0.0'), ('b2', 'Board-102', 'c2', 'CONNECTED', datetime('now'), 'v1.0.0'), ('b3', 'Board-103', 'c3', 'OFFLINE', datetime('now', '-10 minutes'), 'v1.0.0')").run();
    db.prepare("INSERT INTO teachers (id, name, employee_id, department) VALUES ('t1', 'Dr. Sharma', 'EMP001', 'Mathematics'), ('t2', 'Prof. Patil', 'EMP002', 'Physics')").run();
    db.prepare("INSERT INTO subjects (id, name, code) VALUES ('s1', 'Mathematics', 'MATH101'), ('s2', 'Physics', 'PHY101')").run();
    db.prepare("INSERT INTO classes (id, name, year, department) VALUES ('cl1', 'BCA Year 1', '1', 'Computer Applications'), ('cl2', 'BCA Year 2', '2', 'Computer Applications')").run();
    
    // Insert some students
    for (let i = 1; i <= 45; i++) {
      db.prepare("INSERT INTO students (id, roll_number, name, class_id, face_enrolled) VALUES (?, ?, ?, ?, ?)").run('stu_' + i, '' + i, 'Student ' + i, 'cl1', 1);
    }
    for (let i = 46; i <= 83; i++) {
      db.prepare("INSERT INTO students (id, roll_number, name, class_id, face_enrolled) VALUES (?, ?, ?, ?, ?)").run('stu_' + i, '' + i, 'Student ' + i, 'cl2', 1);
    }

    
    const existingTt = db.prepare('SELECT count(*) as count FROM timetable_entries').get();
    if (existingTt.count === 0) {
      db.prepare("INSERT INTO timetable_entries (id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run('tt1', 'Monday', '09:00', '10:00', 'c1', 's1', 't1', 'cl1');
      db.prepare("INSERT INTO timetable_entries (id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run('tt2', 'Tuesday', '10:00', '11:00', 'c2', 's2', 't2', 'cl2');
    }

    // Insert active lecture sessions
    db.prepare("INSERT INTO lecture_sessions (id, classroom_id, subject_id, teacher_id, class_id, status, start_time) VALUES ('ls1', 'c1', 's1', 't1', 'cl1', 'LIVE', datetime('now', '-30 minutes')), ('ls2', 'c2', 's2', 't2', 'cl2', 'LIVE', datetime('now', '-45 minutes'))").run();
    
    // Insert attendance records for ls1 (Room 101)
    for (let i = 1; i <= 45; i++) {
      const status = i <= 42 ? 'PRESENT' : 'NOT_CONFIRMED';
      db.prepare("INSERT INTO attendance_records (id, session_id, student_id, status, confidence) VALUES (?, ?, ?, ?, ?)").run('ar_1_' + i, 'ls1', 'stu_' + i, status, 0.95);
    }
    // Insert attendance records for ls2 (Room 102)
    for (let i = 46; i <= 83; i++) {
      db.prepare("INSERT INTO attendance_records (id, session_id, student_id, status, confidence) VALUES (?, ?, ?, ?, ?)").run('ar_2_' + i, 'ls2', 'stu_' + i, 'PRESENT', 0.92);
    }
  }
}

// SSE Clients for Realtime
let sseClients: any[] = [];
function broadcastEvent(type: string, payload: any) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(c => c.res.write(message));
}

// API Routes
app.get('/api/realtime', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  sseClients.push({ req, res });
  req.on('close', () => { sseClients = sseClients.filter(c => c.res !== res); });
});

app.get('/api/dashboard', (req, res) => {
  const classrooms = db.prepare('SELECT * FROM classrooms').all();
  const boards = db.prepare('SELECT * FROM digital_boards').all();
  const activeLectures = db.prepare("SELECT * FROM lecture_sessions WHERE status = 'LIVE' OR status = 'FINAL_VERIFICATION'").all();
  const pendingRecords = db.prepare("SELECT count(*) as count FROM attendance_records WHERE status = 'NOT_CONFIRMED' OR status = 'VERIFICATION_REQUIRED'").get();
  
  res.json({
    totalClassrooms: classrooms.length,
    activeLectures: activeLectures.length,
    connectedBoards: boards.filter((b: any) => b.status === 'CONNECTED').length,
    totalBoards: boards.length,
    pendingVerification: pendingRecords.count,
    sessionsActive: activeLectures.length
  });
});

app.get('/api/classrooms/live', (req, res) => {
  const live = db.prepare(`
    SELECT 
      c.id as classroom_id, c.name as room_name,
      b.status as board_status,
      ls.id as session_id, ls.status as session_status,
      s.name as subject_name,
      t.name as teacher_name,
      cl.name as class_name,
      (SELECT count(*) FROM attendance_records WHERE session_id = ls.id AND status = 'PRESENT') as present_count,
      (SELECT count(*) FROM attendance_records WHERE session_id = ls.id AND (status = 'NOT_CONFIRMED' OR status = 'VERIFICATION_REQUIRED')) as pending_count,
      (SELECT count(*) FROM attendance_records WHERE session_id = ls.id AND status = 'ABSENT') as absent_count
    FROM classrooms c
    LEFT JOIN digital_boards b ON b.classroom_id = c.id
    LEFT JOIN lecture_sessions ls ON ls.classroom_id = c.id AND (ls.status = 'LIVE' OR ls.status = 'FINAL_VERIFICATION')
    LEFT JOIN subjects s ON ls.subject_id = s.id
    LEFT JOIN teachers t ON ls.teacher_id = t.id
    LEFT JOIN classes cl ON ls.class_id = cl.id
  `).all();
  res.json(live);
});

app.get('/api/boards', (req, res) => {
  const boards = db.prepare(`
    SELECT b.*, c.name as classroom_name 
    FROM digital_boards b 
    LEFT JOIN classrooms c ON b.classroom_id = c.id
  `).all();
  res.json(boards);
});


app.get('/api/students', (req, res) => {
  const students = db.prepare(`
    SELECT s.*, cl.name as class_name
    FROM students s
    LEFT JOIN classes cl ON s.class_id = cl.id
  `).all();
  
  // For each student, find their allocated rooms from timetable
  const result = students.map(s => {
    const rooms = db.prepare(`
      SELECT DISTINCT c.name as room_name
      FROM timetable_entries te
      JOIN classrooms c ON te.classroom_id = c.id
      WHERE te.class_id = ?
    `).all(s.class_id);
    
    return {
      ...s,
      rooms: rooms.map(r => r.room_name)
    };
  });
  
  res.json(result);
});

app.post('/api/students', (req, res) => {
  const { name, roll_number, class_id, image_url } = req.body;
  const id = 'st_' + Date.now();
  db.prepare('INSERT INTO students (id, name, roll_number, class_id, face_enrolled, image_url) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, name, roll_number, class_id, 1, image_url
  );
  res.json({ success: true, id });
});

app.get('/api/classes', (req, res) => {
  const classes = db.prepare('SELECT * FROM classes').all();
  res.json(classes);
});




app.get('/api/teachers', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers').all();
  const classesTaught = db.prepare(`
    SELECT DISTINCT te.teacher_id, cl.year, cl.name as class_name 
    FROM timetable_entries te 
    JOIN classes cl ON te.class_id = cl.id
  `).all();
  
  const result = teachers.map(t => ({
    ...t,
    teaching_years: [...new Set(classesTaught.filter(c => c.teacher_id === t.id).map(c => c.year))],
    teaching_classes: [...new Set(classesTaught.filter(c => c.teacher_id === t.id).map(c => c.class_name))]
  }));
  res.json(result);
});

app.post('/api/classrooms', (req, res) => {
  const { name, capacity } = req.body;
  const id = 'c' + Date.now();
  db.prepare('INSERT INTO classrooms (id, name, status, capacity) VALUES (?, ?, ?, ?)').run(id, name, 'ACTIVE', capacity || 30);
  res.json({ success: true, id });
});

app.post('/api/boards', (req, res) => {
  const { name, classroom_id } = req.body;
  const id = 'b' + Date.now();
  db.prepare('INSERT INTO digital_boards (id, name, classroom_id, status, last_heartbeat, software_version) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, classroom_id, 'OFFLINE', new Date().toISOString(), 'v1.0.0');
  res.json({ success: true, id });
});


app.post('/api/boards/pair', (req, res) => {
  const { room_name, otp } = req.body;
  if (!otp || otp.length < 4) {
    return res.status(400).json({ error: 'Invalid LAN OTP' });
  }
  
  // Create a unified Classroom + Board pairing using OTP over LAN logic
  const classId = 'c_' + Date.now();
  const boardId = 'b_' + Date.now();
  
  // Register the fixed room (e.g. Room 101)
  db.prepare('INSERT INTO classrooms (id, name, status, capacity) VALUES (?, ?, ?, ?)').run(classId, room_name, 'ACTIVE', 30);
  // Bind the digital board permanently to the classroom
  db.prepare('INSERT INTO digital_boards (id, name, classroom_id, status, last_heartbeat, software_version) VALUES (?, ?, ?, ?, ?, ?)').run(boardId, room_name + ' Digital Board', classId, 'CONNECTED', new Date().toISOString(), 'v2.0-LAN-Sync');
  
  res.json({ success: true, classroom_id: classId, board_id: boardId });
});

app.post('/api/teachers', (req, res) => {
  const { name, department, employee_id } = req.body;
  const id = 't_' + Date.now();
  db.prepare('INSERT INTO teachers (id, name, department, employee_id) VALUES (?, ?, ?, ?)').run(id, name, department, employee_id);
  res.json({ success: true, id });
});

app.get('/api/timetable/config', (req, res) => {
  const config = db.prepare('SELECT * FROM timetable_config LIMIT 1').get() || {
    days: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
    start_time: '09:00',
    end_time: '16:00',
    slot_duration: 60
  };
  res.json({ ...config, days: typeof config.days === 'string' ? JSON.parse(config.days) : config.days });
});

app.post('/api/timetable/config', (req, res) => {
  const { days, start_time, end_time, slot_duration } = req.body;
  const existing = db.prepare('SELECT id FROM timetable_config LIMIT 1').get();
  if (existing) {
    db.prepare('UPDATE timetable_config SET days = ?, start_time = ?, end_time = ?, slot_duration = ? WHERE id = ?')
      .run(JSON.stringify(days), start_time, end_time, slot_duration, existing.id);
  } else {
    db.prepare('INSERT INTO timetable_config (id, days, start_time, end_time, slot_duration) VALUES (?, ?, ?, ?, ?)')
      .run('cfg1', JSON.stringify(days), start_time, end_time, slot_duration);
  }
  res.json({ success: true });
});

app.get('/api/timetable', (req, res) => {
  const entries = db.prepare(`
    SELECT te.*, c.name as classroom_name, s.name as subject_name, t.name as teacher_name, cl.name as class_name
    FROM timetable_entries te
    LEFT JOIN classrooms c ON te.classroom_id = c.id
    LEFT JOIN subjects s ON te.subject_id = s.id
    LEFT JOIN teachers t ON te.teacher_id = t.id
    LEFT JOIN classes cl ON te.class_id = cl.id
  `).all();
  res.json(entries);
});

app.post('/api/timetable', (req, res) => {
  const { id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id } = req.body;
  db.prepare('INSERT OR REPLACE INTO timetable_entries (id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, day_of_week, start_time, end_time, classroom_id, subject_id, teacher_id, class_id);
  res.json({ success: true });
});

app.delete('/api/timetable/:id', (req, res) => {
  db.prepare('DELETE FROM timetable_entries WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/reports/detailed', (req, res) => {
  const activeSessions = db.prepare("SELECT * FROM lecture_sessions").all();
  const roomReports = [];
  for (const session of activeSessions) {
    const classroom = db.prepare("SELECT * FROM classrooms WHERE id = ?").get(session.classroom_id);
    const records = db.prepare(`
      SELECT s.name as student_name, ar.status as attendance_status, 
             (SELECT count(*) FROM attendance_records past_ar WHERE past_ar.student_id = s.id AND past_ar.status = 'PRESENT') as total_presents
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = ?
    `).all(session.id);
    
    roomReports.push({
      room_name: classroom.name,
      records: records.map(r => ({
        student_name: r.student_name,
        status: r.attendance_status === 'PRESENT' ? 'Present' : 'Absent',
        previous_record: `${r.total_presents} Presents`
      }))
    });
  }
  res.json(roomReports);
});

// Remove old AI route


// Demo mode trigger to simulate a new scan
app.post('/api/demo/scan', (req, res) => {
  const pending = db.prepare("SELECT * FROM attendance_records WHERE status = 'NOT_CONFIRMED' LIMIT 1").get();
  if (pending) {
    db.prepare(`UPDATE attendance_records SET status = 'PRESENT' WHERE id = ?`).run(pending.id);
    broadcastEvent('ATTENDANCE_UPDATE', { sessionId: pending.session_id, studentId: pending.student_id, status: 'PRESENT' });
  }
  res.json({ success: true, updated: pending });
});

async function startServer() {
  setupDb();
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
