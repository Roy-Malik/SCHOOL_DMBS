const express = require('express');
const router = express.Router();
const pool = require('../db');
const { body, validationResult } = require('express-validator');

// === MIDDLEWARE ===
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/');
}

function requireStaff(req, res, next) {
  if (req.session.user && ['admin', 'teacher', 'principal'].includes(req.session.user.role)) {
    return next();
  }
  res.redirect('/student-dashboard');
}

// === HELPERS ===
async function fetchClasses() {
  const [rows] = await pool.execute('SELECT * FROM Class ORDER BY class_name, section');
  return rows;
}
async function fetchSubjects() {
  const [rows] = await pool.execute('SELECT * FROM Subject ORDER BY subject_name');
  return rows;
}
async function fetchTeachers() {
  const [rows] = await pool.execute('SELECT * FROM Teacher ORDER BY teacher_name');
  return rows;
}
async function fetchExams() {
  const [rows] = await pool.execute('SELECT * FROM Exam ORDER BY exam_date DESC');
  return rows;
}

// === AUTH ROUTES ===
router.get('/', (req, res) => {
  if (req.session.user) {
    return req.session.user.role === 'student' 
      ? res.redirect('/student-dashboard') 
      : res.redirect('/staff-dashboard');
  }
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM User_Login WHERE username = ?', [username]);
    if (rows.length === 0) return res.render('login', { error: 'Invalid Credentials' });
    const user = rows[0];
    if (password === user.password_hash) {
      req.session.user = { id: user.user_id, username: user.username, role: user.role };
      return res.redirect(user.role === 'student' ? '/student-dashboard' : '/staff-dashboard');
    }
    res.render('login', { error: 'Invalid Credentials' });
  } catch (err) { res.render('login', { error: 'Server Error' }); }
});

router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

// ==========================================
// STUDENT VIEW
// ==========================================
router.get('/student-dashboard', requireLogin, async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT * FROM Student JOIN Class USING(class_id) WHERE user_id = ?', [req.session.user.id]);
    if (students.length === 0) return res.send("Student profile not found.");
    
    const [results] = await pool.execute(`
      SELECT m.marks_obtained, s.subject_name, e.exam_name,
             (SELECT grade_letter FROM Grade WHERE m.marks_obtained BETWEEN mark_range_low AND mark_range_high LIMIT 1) as grade
      FROM Marks m
      JOIN Exam_Schedule es ON m.schedule_id = es.schedule_id
      JOIN Subject s ON es.subject_id = s.subject_id
      JOIN Exam e ON es.exam_id = e.exam_id
      WHERE m.student_id = ?
      ORDER BY e.exam_date DESC
    `, [students[0].student_id]);

    res.render('student_dashboard', { user: req.session.user, student: students[0], results });
  } catch (err) { console.error(err); res.send("Error loading dashboard"); }
});

// ==========================================
// STAFF - MAIN DASHBOARD (List Students)
// ==========================================
router.get('/staff-dashboard', requireLogin, requireStaff, async (req, res) => {
  try {
    // Only fetch student list for the main page
    const [allStudents] = await pool.execute(`
      SELECT s.student_id, s.student_name, s.roll_no, c.class_name, c.section 
      FROM Student s 
      JOIN Class c ON s.class_id = c.class_id 
      ORDER BY c.class_name, s.roll_no
    `);
    
    res.render('staff_dashboard', { user: req.session.user, allStudents });
  } catch (err) { res.status(500).send("Error loading dashboard"); }
});

// ==========================================
// STAFF - ADD STUDENT PAGE
// ==========================================
router.get('/add-student', requireLogin, requireStaff, async (req, res) => {
  const classes = await fetchClasses();
  res.render('add_student', { classes, error: null, success: null });
});

router.post('/insert-student', requireLogin, requireStaff, [
  body('student_name').notEmpty(), body('roll_no').notEmpty(), body('username').notEmpty()
], async (req, res) => {
  const classes = await fetchClasses();
  if (!validationResult(req).isEmpty()) return res.render('add_student', { classes, error: "Missing required fields", success: null });
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [uRes] = await conn.execute(`INSERT INTO User_Login (username, password_hash, role) VALUES (?, ?, 'student')`, [req.body.username, req.body.password]);
    await conn.execute(`INSERT INTO Student (student_name, roll_no, dob, gender, class_id, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.body.student_name, req.body.roll_no, req.body.dob||null, req.body.gender||null, req.body.class_id, uRes.insertId]);
    await conn.commit();
    
    // Stay on add page to allow adding another student easily
    res.render('add_student', { classes, error: null, success: "Student registered successfully!" });
  } catch (err) { 
    await conn.rollback(); 
    res.render('add_student', { classes, error: "Error: Roll No or Username already exists.", success: null });
  } finally { conn.release(); }
});

// ==========================================
// STAFF - EXAM MANAGEMENT PAGE
// ==========================================
router.get('/manage-exams', requireLogin, requireStaff, async (req, res) => {
  const [classes, subjects, teachers, exams] = await Promise.all([fetchClasses(), fetchSubjects(), fetchTeachers(), fetchExams()]);
  res.render('manage_exams', { classes, subjects, teachers, exams, message: null });
});

router.post('/create-exam', requireLogin, requireStaff, async (req, res) => {
  try {
    await pool.execute('INSERT INTO Exam (exam_name, exam_date) VALUES (?, ?)', [req.body.exam_name, req.body.exam_date]);
    // Redirect back to manage exams to refresh the list
    res.redirect('/manage-exams');
  } catch (err) { res.send("Error creating exam"); }
});

router.post('/schedule-exam', requireLogin, requireStaff, async (req, res) => {
  try {
    await pool.execute('INSERT INTO Exam_Schedule (exam_id, class_id, subject_id, teacher_id) VALUES (?, ?, ?, ?)',
      [req.body.exam_id, req.body.class_id, req.body.subject_id, req.body.teacher_id]);
    res.redirect('/manage-exams');
  } catch (err) { res.send("Error scheduling exam. It might already be scheduled."); }
});

// ==========================================
// EDIT & DELETE OPERATIONS
// ==========================================
router.get('/edit-student/:id', requireLogin, requireStaff, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM Student WHERE student_id = ?', [req.params.id]);
  const classes = await fetchClasses();
  if(rows.length === 0) return res.redirect('/staff-dashboard');
  res.render('edit_student', { student: rows[0], classes, success: null });
});

router.post('/update-student/:id', requireLogin, requireStaff, async (req, res) => {
  try {
    await pool.execute('UPDATE Student SET student_name=?, roll_no=?, dob=?, class_id=? WHERE student_id=?',
      [req.body.student_name, req.body.roll_no, req.body.dob, req.body.class_id, req.params.id]);
    const classes = await fetchClasses();
    res.render('edit_student', { student: { ...req.body, student_id: req.params.id }, classes, success: "Student updated successfully!" });
  } catch (err) { res.send("Error updating student"); }
});

router.post('/delete-student/:id', requireLogin, requireStaff, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT user_id FROM Student WHERE student_id = ?', [req.params.id]);
    if(rows.length > 0) await conn.execute('DELETE FROM User_Login WHERE user_id = ?', [rows[0].user_id]);
    res.redirect('/staff-dashboard');
  } catch (err) { res.send("Error deleting student."); } finally { conn.release(); }
});

// ==========================================
// MARKS MANAGEMENT
// ==========================================
router.get('/manage-marks/:id', requireLogin, requireStaff, async (req, res) => {
  const [sRows] = await pool.execute('SELECT * FROM Student JOIN Class USING(class_id) WHERE student_id = ?', [req.params.id]);
  const student = sRows[0];
  const [marksData] = await pool.execute(`
    SELECT es.schedule_id, e.exam_name, s.subject_name, m.marks_obtained, m.mark_id
    FROM Exam_Schedule es
    JOIN Exam e ON es.exam_id = e.exam_id
    JOIN Subject s ON es.subject_id = s.subject_id
    LEFT JOIN Marks m ON es.schedule_id = m.schedule_id AND m.student_id = ?
    WHERE es.class_id = ?
  `, [student.student_id, student.class_id]);
  res.render('manage_marks', { student, marksData });
});

router.post('/save-mark', requireLogin, requireStaff, async (req, res) => {
  const { student_id, schedule_id, mark_id, marks_obtained } = req.body;
  try {
    if (mark_id) {
      await pool.execute('UPDATE Marks SET marks_obtained = ? WHERE mark_id = ?', [marks_obtained, mark_id]);
    } else {
      await pool.execute('INSERT INTO Marks (student_id, schedule_id, marks_obtained) VALUES (?, ?, ?)', [student_id, schedule_id, marks_obtained]);
    }
    res.redirect(`/manage-marks/${student_id}`);
  } catch (err) { res.send("Error saving mark."); }
});

module.exports = router;