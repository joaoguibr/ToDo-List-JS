const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const app = express();

app.use(express.json());
app.use(cors);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/users", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users");
    return res.status(200).send(rows);
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.post("/session", async (req, res) => {
  const { username } = req.body;
  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE user_name = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).send("Username already exists");
    }

    const newSession = await pool.query(
      "INSERT INTO users (user_name) VALUES ($1) RETURNING *",
      [username]
    );

    return res.status(200).send(newSession.rows);
  } catch (error) {
    return res.status(500).send(error);
  }
});

app.post("/todo/:user_id", async (req, res) => {
  const { description, done } = req.body;
  const { user_id } = req.params;
  try {
    const newTODO = await pool.query(
      "INSERT INTO todo (todo_description, todo_done, user_id) VALUES ($1, $2, $3) RETURNING *",
      [description, done, user_id]
    );
    return res.status(200).send(newTODO.rows);
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.get("/todo/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const allTodos = await pool.query("SELECT * FROM todo WHERE user_id = $1", [
      user_id,
    ]);
    return res.status(200).send(allTodos.rows);
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.patch("/todo/:user_id/:todo_id", async (req, res) => {
  const { user_id, todo_id } = req.params;
  const { description, done } = req.body;
  try {
    const updatedTodo = await pool.query(
      "UPDATE todo SET todo_description = $1, todo_done = $2 WHERE user_id = $3 AND todo_id = $4 RETURNING *",
      [description, done, user_id, todo_id]
    );
    return res.status(200).send(updatedTodo.rows);
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.delete("/todo/:user_id/:todo_id", async (req, res) => {
  const { user_id, todo_id } = req.params;
  try {
    const deletedTodo = await pool.query(
      "DELETE FROM todo WHERE user_id = $1 AND todo_id = $2 RETURNING *",
      [user_id, todo_id]
    );
    return res.status(200).send(deletedTodo.rows);
  } catch (error) {
    return res.status(400).send(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
