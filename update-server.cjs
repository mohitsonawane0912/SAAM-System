const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace sqlite imports
code = code.replace(/import sqlite3 from 'sqlite3';\nimport { open } from 'sqlite';/, "import Database from 'better-sqlite3';");

// Replace setupDb logic
code = code.replace(/let db: any;\nasync function setupDb\(\) {[^}]+}/s, `
let db: any;
function setupDb() {
  db = new Database('./saam-database.sqlite');
  db.pragma('foreign_keys = ON');

  db.exec(\`
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
  \`);

  const hasClassrooms = db.prepare('SELECT count(*) as count FROM classrooms').get();
  if (hasClassrooms.count === 0) {
    db.prepare("INSERT INTO classrooms (id, name, status, capacity) VALUES ('c1', 'Room 101', 'ACTIVE', 60), ('c2', 'Room 102', 'ACTIVE', 50), ('c3', 'Room 103', 'ACTIVE', 60)").run();
    db.prepare("INSERT INTO digital_boards (id, name, classroom_id, status, last_heartbeat, software_version) VALUES ('b1', 'Board-101', 'c1', 'CONNECTED', datetime('now'), 'v1.0.0'), ('b2', 'Board-102', 'c2', 'CONNECTED', datetime('now'), 'v1.0.0'), ('b3', 'Board-103', 'c3', 'OFFLINE', datetime('now', '-10 minutes'), 'v1.0.0')").run();
    db.prepare("INSERT INTO teachers (id, name, employee_id, department) VALUES ('t1', 'Dr. Sharma', 'EMP001', 'Mathematics'), ('t2', 'Prof. Patil', 'EMP002', 'Physics')").run();
    db.prepare("INSERT INTO subjects (id, name, code) VALUES ('s1', 'Mathematics', 'MATH101'), ('s2', 'Physics', 'PHY101')").run();
    db.prepare("INSERT INTO classes (id, name, year, department) VALUES ('cl1', 'BCA Year 1', '1', 'Computer Applications'), ('cl2', 'BCA Year 2', '2', 'Computer Applications')").run();
    
    for (let i = 1; i <= 45; i++) {
      db.prepare("INSERT INTO students (id, roll_number, name, class_id, face_enrolled) VALUES (?, ?, ?, ?, ?)").run('stu_' + i, '' + i, 'Student ' + i, 'cl1', 1);
    }
    for (let i = 46; i <= 83; i++) {
      db.prepare("INSERT INTO students (id, roll_number, name, class_id, face_enrolled) VALUES (?, ?, ?, ?, ?)").run('stu_' + i, '' + i, 'Student ' + i, 'cl2', 1);
    }

    db.prepare("INSERT INTO lecture_sessions (id, classroom_id, subject_id, teacher_id, class_id, status, start_time) VALUES ('ls1', 'c1', 's1', 't1', 'cl1', 'LIVE', datetime('now', '-30 minutes')), ('ls2', 'c2', 's2', 't2', 'cl2', 'LIVE', datetime('now', '-45 minutes'))").run();
    
    for (let i = 1; i <= 45; i++) {
      const status = i <= 42 ? 'PRESENT' : 'NOT_CONFIRMED';
      db.prepare("INSERT INTO attendance_records (id, session_id, student_id, status, confidence) VALUES (?, ?, ?, ?, ?)").run('ar_1_' + i, 'ls1', 'stu_' + i, status, 0.95);
    }
    for (let i = 46; i <= 83; i++) {
      db.prepare("INSERT INTO attendance_records (id, session_id, student_id, status, confidence) VALUES (?, ?, ?, ?, ?)").run('ar_2_' + i, 'ls2', 'stu_' + i, 'PRESENT', 0.92);
    }
  }
}
`);

// Now replace all await db.all and await db.get and await db.run
code = code.replace(/await db\.all\((.*?)\)/g, 'db.prepare($1).all()');
code = code.replace(/await db\.get\((.*?)\)/g, 'db.prepare($1).get()');
code = code.replace(/await db\.run\((.*?),\s*\[(.*?)\]\)/g, 'db.prepare($1).run($2)');
code = code.replace(/await db\.run\((.*?)\)/g, 'db.prepare($1).run()');
code = code.replace(/await setupDb\(\)/g, 'setupDb()');

fs.writeFileSync('server.ts', code, 'utf8');
