console.log("Backend initialization started");
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create or open the database file
const db = new Database("classreminder.db");

// Create the courses table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course TEXT NOT NULL,
    code TEXT DEFAULT '',
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    room TEXT DEFAULT '',
    lecturer TEXT DEFAULT ''
  )
`);

// Add end_time to an existing database if needed
try {
  db.exec(
    "ALTER TABLE courses ADD COLUMN end_time TEXT DEFAULT ''"
  );
} catch (error) {
  if (!error.message.includes("duplicate column name")) {
    throw error;
  }
}

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "ClassReminder API is running!",
    status: "success",
  });
});

// Get all courses
app.get("/api/courses", (req, res) => {
  const courses = db
    .prepare("SELECT * FROM courses ORDER BY id DESC")
    .all();

  res.json(courses);
});

// Add a course

app.post("/api/courses", (req, res) => {
  const { course, code, day, time, end_time, room, lecturer } = req.body;

  if (!course || !day || !time || !end_time) {
    return res.status(400).json({
      error: "Course, day, start time, and end time are required.",
    });
  }

  if (end_time <= time) {
    return res.status(400).json({
      error: "End time must be later than start time.",
    });
  }

  const result = db.prepare(`
    INSERT INTO courses
      (course, code, day, time, end_time, room, lecturer)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    course,
    code || "",
    day,
    time,
    end_time,
    room || "",
    lecturer || ""
  );

  const savedCourse = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(savedCourse);
});

 // Update an existing course
app.put("/api/courses/:id", (req, res) => {
  const { course, code, day, time, end_time, room, lecturer } = req.body;
  const id = Number(req.params.id);

  if (!course || !day || !time || !end_time) {
    return res.status(400).json({
      error: "Course, day, start time, and end time are required.",
    });
  }

  if (end_time <= time) {
    return res.status(400).json({
      error: "End time must be later than start time.",
    });
  }


// Delete a course
app.delete("/api/courses/:id", (req, res) => {
    
  const result = db.prepare(`
    UPDATE courses
    SET course = ?, code = ?, day = ?, time = ?,
        end_time = ?, room = ?, lecturer = ?
    WHERE id = ?
  `).run(
    course,
    code || "",
    day,
    time,
    end_time,
    room || "",
    lecturer || "",
    id
  );

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Course not found.",
    });
  }

  const updatedCourse = db
    .prepare("SELECT * FROM courses WHERE id = ?")
    .get(id);

  res.json(updatedCourse);
});

  const result = db
    .prepare("DELETE FROM courses WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Course not found.",
    });
  }

  res.json({ message: "Course deleted successfully." });
});


console.log("About to start listening...");
// Start server
app.listen(PORT, () => {
  console.log(`ClassReminder server running at http://localhost:${PORT}`);
});