const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- DUMMY DATA IN MEMORY ---
const userProfiles = {
  u1: {
    weaknesses: [],
    learningPath: [],
    progress: 0,
  },
};
const userLogs = {
  u1: [],
};

function addLog(userId, action, detail) {
  if (!userLogs[userId]) userLogs[userId] = [];
  userLogs[userId].push({
    time: new Date().toISOString(),
    action,
    detail,
  });
  // Limit log length (ล่าสุด 100 รายการ)
  if (userLogs[userId].length > 100) {
    userLogs[userId] = userLogs[userId].slice(-100);
  }
}

// --- WEAKNESS ENDPOINTS ---
// Get
app.get("/weakness/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userProfiles[userId]) userProfiles[userId] = { weaknesses: [], learningPath: [], progress: 0 };
  res.json({ weaknesses: userProfiles[userId].weaknesses });
});
// Add
app.post("/weakness/:userId", (req, res) => {
  const { userId } = req.params;
  const { title, description, improveAction } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  if (!userProfiles[userId]) userProfiles[userId] = { weaknesses: [], learningPath: [], progress: 0 };
  const id = "w" + (userProfiles[userId].weaknesses.length + 1);
  const newWeakness = { id, title, description, improveAction };
  userProfiles[userId].weaknesses.push(newWeakness);
  addLog(userId, "add_weakness", { ...newWeakness });
  res.json({ success: true, weakness: newWeakness });
});
// Edit
app.put("/weakness/:userId/:weaknessId", (req, res) => {
  const { userId, weaknessId } = req.params;
  const { title, description, improveAction } = req.body;
  const weaknesses = userProfiles[userId]?.weaknesses || [];
  const idx = weaknesses.findIndex((w) => w.id === weaknessId);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const old = { ...weaknesses[idx] };
  weaknesses[idx] = { ...weaknesses[idx], title, description, improveAction };
  addLog(userId, "edit_weakness", { from: old, to: weaknesses[idx] });
  res.json({ success: true, weakness: weaknesses[idx] });
});
// Delete
app.delete("/weakness/:userId/:weaknessId", (req, res) => {
  const { userId, weaknessId } = req.params;
  const weaknesses = userProfiles[userId]?.weaknesses || [];
  const idx = weaknesses.findIndex((w) => w.id === weaknessId);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const removed = weaknesses.splice(idx, 1)[0];
  addLog(userId, "delete_weakness", { deleted: removed });
  res.json({ success: true });
});

// --- LEARNING PATH ENDPOINTS ---
// Get
app.get("/learning-path/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userProfiles[userId]) userProfiles[userId] = { weaknesses: [], learningPath: [], progress: 0 };
  res.json({ path: userProfiles[userId].learningPath });
});
// Add
app.post("/learning-path/:userId", (req, res) => {
  const { userId } = req.params;
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  if (!userProfiles[userId]) userProfiles[userId] = { weaknesses: [], learningPath: [], progress: 0 };
  const id = "l" + (userProfiles[userId].learningPath.length + 1);
  const newStep = { id, title, description, completed: false };
  userProfiles[userId].learningPath.push(newStep);
  addLog(userId, "add_learningStep", { ...newStep });
  res.json({ success: true, step: newStep });
});
// Edit
app.put("/learning-path/:userId/:stepId", (req, res) => {
  const { userId, stepId } = req.params;
  const { title, description, completed } = req.body;
  const steps = userProfiles[userId]?.learningPath || [];
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const old = { ...steps[idx] };
  steps[idx] = { ...steps[idx], title, description, completed };
  addLog(userId, "edit_learningStep", { from: old, to: steps[idx] });
  res.json({ success: true, step: steps[idx] });
});
// Delete
app.delete("/learning-path/:userId/:stepId", (req, res) => {
  const { userId, stepId } = req.params;
  const steps = userProfiles[userId]?.learningPath || [];
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const removed = steps.splice(idx, 1)[0];
  addLog(userId, "delete_learningStep", { deleted: removed });
  res.json({ success: true });
});

// --- PROGRESS ENDPOINTS ---
// Get
app.get("/progress/:userId", (req, res) => {
  const { userId } = req.params;
  if (!userProfiles[userId]) userProfiles[userId] = { weaknesses: [], learningPath: [], progress: 0 };
  res.json({ progress: userProfiles[userId].progress });
});
// Update
app.post("/progress/:userId", (req, res) => {
  const { userId } = req.params;
  const { progress } = req.body;
  if (typeof progress !== "number") return res.status(400).json({ error: "progress (number) is required" });
  if (!userProfiles[userId]) userProfiles[userId] = { weaknesses: [], learningPath: [], progress: 0 };
  userProfiles[userId].progress = progress;
  addLog(userId, "update_progress", { progress });
  res.json({ success: true, progress });
});

// --- HISTORY ENDPOINT ---
app.get("/history/:userId", (req, res) => {
  const { userId } = req.params;
  res.json({ logs: userLogs[userId] || [] });
});

app.get("/", (req, res) => {
  res.send("Learning Dashboard API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});