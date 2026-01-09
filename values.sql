-- Deliverable D2
USE school_exam_db;

-- 1. Classes
INSERT INTO Class (class_name, section) VALUES 
('Grade 10', 'A'), ('Grade 10', 'B'), 
('Grade 9', 'A'), ('Grade 9', 'B'), 
('Grade 8', 'A');

-- 2. Subjects
INSERT INTO Subject (subject_name, credits) VALUES 
('Mathematics', 4), ('Physics', 3), ('English', 3), ('History', 2), ('Computer Science', 4);

-- 3. Grades
INSERT INTO Grade (grade_letter, mark_range_low, mark_range_high) VALUES 
('A', 85.00, 100.00), ('B', 70.00, 84.99), ('C', 55.00, 69.99), ('D', 40.00, 54.99), ('F', 0.00, 39.99);

-- 4. Exams
INSERT INTO Exam (exam_name, exam_date) VALUES 
('Midterm Fall 2024', '2024-10-15'), 
('Final Fall 2024', '2024-12-20');

-- 5. Users (Admin & Teachers)
INSERT INTO User_Login (username, password_hash, role) VALUES 
('admin', '12345', 'admin'),
('teacher_ahmed', '12345', 'teacher'),
('teacher_sana', '12345', 'teacher'),
('teacher_bilal', '12345', 'teacher');

-- 6. Teachers
INSERT INTO Teacher (teacher_name, email, user_id) VALUES 
('Dr. Ahmed', 'ahmed@school.edu', 2),
('Ms. Sana', 'sana@school.edu', 3),
('Mr. Bilal', 'bilal@school.edu', 4);

-- 7. Users (Students)
INSERT INTO User_Login (username, password_hash, role) VALUES 
('std_001', '12345', 'student'), ('std_002', '12345', 'student'), ('std_003', '12345', 'student'),
('std_004', '12345', 'student'), ('std_005', '12345', 'student'), ('std_006', '12345', 'student'),
('std_007', '12345', 'student'), ('std_008', '12345', 'student'), ('std_009', '12345', 'student'),
('std_010', '12345', 'student'), ('std_011', '12345', 'student'), ('std_012', '12345', 'student'),
('std_013', '12345', 'student'), ('std_014', '12345', 'student'), ('std_015', '12345', 'student');

-- 8. Students
INSERT INTO Student (student_name, roll_no, dob, gender, class_id, user_id) VALUES 
('Ali Raza', '23i-001', '2009-05-15', 'Male', 1, 5),
('Fatima Malik', '23i-002', '2009-08-22', 'Female', 1, 6),
('Usman Khalid', '23i-003', '2009-02-10', 'Male', 1, 7),
('Ayesha Khan', '23i-004', '2009-11-05', 'Female', 2, 8),
('Bilal Ahmed', '23i-005', '2009-12-12', 'Male', 2, 9),
('Zainab Bibi', '23i-006', '2009-07-19', 'Female', 2, 10),
('Omar Farooq', '23i-007', '2010-01-10', 'Male', 3, 11),
('Sara Ali', '23i-008', '2010-03-15', 'Female', 3, 12),
('Saad Ahmed', '23i-009', '2010-02-18', 'Male', 3, 13),
('Hira Shoaib', '23i-010', '2010-06-05', 'Female', 4, 14),
('Waleed Qamar', '23i-011', '2010-08-01', 'Male', 4, 15),
('Saman Naveed', '23i-012', '2010-04-25', 'Female', 4, 16),
('Kamran Khan', '23i-013', '2010-09-10', 'Male', 5, 17),
('Nida Yasir', '23i-014', '2010-10-15', 'Female', 5, 18),
('Fahad Mustafa', '23i-015', '2010-11-20', 'Male', 5, 19);

-- 9. Exam Schedules (Crucial: Mapping exams to ALL classes)
INSERT INTO Exam_Schedule (exam_id, class_id, subject_id, teacher_id) VALUES 
-- Midterm for Grade 10-A
(1, 1, 1, 1), (1, 1, 2, 2), (1, 1, 3, 2),
-- Midterm for Grade 10-B
(1, 2, 1, 1), (1, 2, 5, 3),
-- Midterm for Grade 9-A
(1, 3, 1, 1), (1, 3, 3, 2),
-- Midterm for Grade 9-B
(1, 4, 1, 1), (1, 4, 2, 2),
-- Midterm for Grade 8-A
(1, 5, 1, 1), (1, 5, 4, 3);

-- 10. Marks (Some initial marks)
INSERT INTO Marks (student_id, schedule_id, marks_obtained) VALUES 
(1, 1, 85.50), (2, 1, 92.00), (3, 1, 78.00);

SELECT * FROM Exam_Schedule;
SELECT * FROM Exam;
SELECT * FROM Student;