import { useEffect, useRef, useState } from "react";
import "./index.css";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const todayName = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
}).format(new Date());

const tomorrowName = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
}).format(new Date(Date.now() + 86400000));

function App() {
const [classes, setClasses] = useState([]);
const [error, setError] = useState("");
const [loading, setLoading] = useState(true);
const [showForm, setShowForm] = useState(false);
const [editingClassId, setEditingClassId] = useState(null);
const [deletingClassId, setDeletingClassId] = useState(null);
const formPanelRef = useRef(null);
const [activeDay, setActiveDay] = useState("Monday");

  
useEffect(() => {
  async function loadClasses() {
    try {
      const response = await fetch(
        "http://localhost:5000/api/courses"
      );

      if (!response.ok) {
        throw new Error("Could not load courses.");
      }

      const data = await response.json();

      setClasses(
        data.map((item) => ({
          ...item,
          name: item.course,
          start: item.time,
          end: item.end_time,
        }))
      );
    } catch (err) {
      setError(
        "Could not connect to the backend. Make sure the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  loadClasses();
}, []);

useEffect(() => {
  if (showForm && formPanelRef.current) {
    formPanelRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [showForm, editingClassId]);


  const [form, setForm] = useState({
    code: "",
    name: "",
    day: "Monday",
    start: "08:00",
    end: "10:00",
    room: "",
  });

  const todayClasses = classes
    .filter((item) => item.day === todayName)
    .sort((a, b) => a.start.localeCompare(b.start));

  const tomorrowClasses = classes
    .filter((item) => item.day === tomorrowName)
    .sort((a, b) => a.start.localeCompare(b.start));

  const dayClasses = classes
    .filter((item) => item.day === activeDay)
    .sort((a, b) => a.start.localeCompare(b.start));


async function addClass(event) {
  event.preventDefault();
  setError("");

  if (form.end <= form.start) {
    setError("The end time must be later than the start time.");
    return;
  }

  const coursePayload = {
    course: form.name.trim(),
    code: form.code.trim(),
    day: form.day,
    time: form.start,
    end_time: form.end,
    room: form.room.trim(),
  };

  try {
    const isEditing = editingClassId !== null;
    const url = isEditing
      ? `http://localhost:5000/api/courses/${editingClassId}`
      : "http://localhost:5000/api/courses";

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coursePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || (isEditing ? "Could not update the course." : "Could not save the course.")
      );
    }

    const savedClass = {
      ...data,
      name: data.course,
      start: data.time,
      end: data.end_time,
    };

    if (isEditing) {
      setClasses((previous) =>
        previous.map((item) => item.id === savedClass.id ? savedClass : item)
      );
    } else {
      setClasses((previous) => [...previous, savedClass]);
    }

    setActiveDay(savedClass.day);
    resetForm();
  } catch (err) {
    setError(err.message || "Something went wrong while saving the course.");
  }
}

function resetForm() {
  setForm({
    code: "",
    name: "",
    day: "Monday",
    start: "08:00",
    end: "10:00",
    room: "",
  });
  setEditingClassId(null);
  setShowForm(false);
}

function startEdit(item) {
  setError("");
  setEditingClassId(item.id);
  setForm({
    code: item.code || "",
    name: item.name || item.course || "",
    day: item.day,
    start: item.start || item.time,
    end: item.end || item.end_time,
    room: item.room || "",
  });
  setActiveDay(item.day);
  setShowForm(true);
}


async function deleteClass(id) {
  setError("");

  const confirmed = window.confirm("Are you sure you want to delete this class?");
  if (!confirmed) return;

  setDeletingClassId(id);

  try {
    const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
      method: "DELETE",
    });

    // Read the response safely so a non-JSON backend error is also understandable.
    const responseText = await response.text();
    let data = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `Delete failed (HTTP ${response.status}).`);
    }

    // Compare IDs as strings to avoid number/string mismatches.
    setClasses((previous) => previous.filter((item) => String(item.id) !== String(id)));
  } catch (err) {
    setError(
      err.message === "Failed to fetch"
        ? "Could not reach the backend. Check that the server is running on port 5000."
        : (err.message || "Could not delete the course.")
    );
  } finally {
    setDeletingClassId(null);
  }
}


  function formatTime(time) {
    return new Date(`2000-01-01T${time}:00`).toLocaleTimeString(
      "en-US",
      { hour: "numeric", minute: "2-digit" }
    );
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">C</span>
          <span>ClassReminder</span>
        </div>

        <p className="side-label">WORKSPACE</p>

        <button className="nav-item active">
          <span>▦</span> Dashboard
        </button>

        <button
          className="nav-item"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <span>＋</span> Add a class
        </button>

        <div className="sidebar-bottom">
          <div className="avatar">CS</div>
          <div>
            <strong>My timetable</strong>
            <small>University of Buea</small>
          </div>
        </div>
      </aside>

      <section className="main-content">
        {error && (
  <p role="alert" style={{ color: "crimson" }}>
    {error}
  </p>
)}
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR ACADEMIC ORGANIZER</p>
            <h1>My dashboard</h1>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
          >
            + Add class
          </button>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow light">YOUR DAY, ORGANIZED</p>
            <h2>Stay ahead of every lecture.</h2>
            <p>
              Know what's coming up and make every class count.
            </p>
          </div>
          <div className="welcome-icon">◷</div>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <span className="summary-icon">▦</span>
            <p>All scheduled classes</p>
            <h2>{classes.length}</h2>
            <small>Across your timetable</small>
          </article>

          <article className="summary-card">
            <span className="summary-icon purple">◷</span>
            <p>Classes today</p>
            <h2>{todayClasses.length}</h2>
            <small>{todayName}</small>
          </article>

          <article className="summary-card">
            <span className="summary-icon orange">♧</span>
            <p>Classes tomorrow</p>
            <h2>{tomorrowClasses.length}</h2>
            <small>{tomorrowName}</small>
          </article>
        </section>

        {showForm && (
          <section className="panel form-panel" ref={formPanelRef}>
            <div className="section-heading">
              <div>
                <h2>{editingClassId ? "Edit class" : "Add a class"}</h2>
                <p>{editingClassId ? "Update the lecture details below." : "Enter your lecture details below."}</p>
              </div>
              <button
                className="close-button"
                onClick={resetForm}
              >
                ✕
              </button>
            </div>

            <form onSubmit={addClass} className="class-form">
              <label>
                Course code
                <input
                  required
                  placeholder="e.g. CSC 301"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                />
              </label>

              <label className="full-width">
                Course name
                <input
                  required
                  placeholder="e.g. Data Structures and Algorithms"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </label>

              <label>
                Day
                <select
                  value={form.day}
                  onChange={(e) =>
                    setForm({ ...form, day: e.target.value })
                  }
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label>
                Classroom
                <input
                  placeholder="e.g. LT 1"
                  value={form.room}
                  onChange={(e) =>
                    setForm({ ...form, room: e.target.value })
                  }
                />
              </label>

              <label>
                Start time
                <input
                  type="time"
                  required
                  value={form.start}
                  onChange={(e) =>
                    setForm({ ...form, start: e.target.value })
                  }
                />
              </label>

              <label>
                End time
                <input
                  type="time"
                  required
                  value={form.end}
                  onChange={(e) =>
                    setForm({ ...form, end: e.target.value })
                  }
                />
              </label>

              <div className="form-actions full-width">
                <button className="primary-button" type="submit">
                  {editingClassId ? "Update class" : "Save class"}
                </button>
                <button className="secondary-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
{loading && <p>Loading your saved courses...</p>}
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Weekly timetable</h2>
              <p>Select a day to see your lectures.</p>
            </div>
            <span className="live-label">● THIS WEEK</span>
          </div>

          <div className="day-tabs">
            {days.map((day) => (
              <button
                key={day}
                className={`day-tab ${activeDay === day ? "selected" : ""}`}
                onClick={() => setActiveDay(day)}
              >
                <span>{day.slice(0, 3)}</span>
                <strong>{classes.filter((c) => c.day === day).length}</strong>
              </button>
            ))}
          </div>

          <div className="class-list">
            {dayClasses.length === 0 ? (
              <div className="empty-state">
                <span>☀</span>
                <h3>No classes scheduled</h3>
                <p>Your timetable is clear for {activeDay}.</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setForm({ ...form, day: activeDay });
                    setShowForm(true);
                  }}
                >
                  + Schedule a class
                </button>
              </div>
            ) : (
              dayClasses.map((item) => (
                <article className="class-row" key={item.id}>
                  <div className="class-time">
                    <strong>{formatTime(item.start)}</strong>
                    <span>{formatTime(item.end)}</span>
                  </div>

                  <div className="time-line" />

                  <div className="class-info">
                    <span className="course-code">{item.code}</span>
                    <h3>{item.name}</h3>
                    <p>⌖ {item.room || "Room not set"}</p>
                  </div>

                  <div className="class-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        startEdit(item);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      title="Delete class"
                      aria-label={`Delete ${item.name}`}
                      disabled={deletingClassId !== null}
                      onClick={() => deleteClass(item.id)}
                    >
                      {String(deletingClassId) === String(item.id) ? "…" : "✕"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel upcoming-panel">
          <div className="section-heading">
            <div>
              <h2>Coming up tomorrow</h2>
              <p>Get prepared for your next day.</p>
            </div>
            <span className="notification-icon">♧</span>
          </div>

          {tomorrowClasses.length === 0 ? (
            <p className="muted">
              No classes scheduled for tomorrow yet.
            </p>
          ) : (
            tomorrowClasses.map((item) => (
              <div className="tomorrow-row" key={item.id}>
                <div>
                  <strong>{item.code} · {item.name}</strong>
                  <p>{formatTime(item.start)} – {formatTime(item.end)}</p>
                </div>
                <span className="room-tag">{item.room || "No room"}</span>
              </div>
            ))
          )}
        </section>

        <footer>
          ClassReminder · Built for students, one lecture at a time.
        </footer>
      </section>
    </main>
  );
}

export default App;

