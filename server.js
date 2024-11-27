const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_db"
);
const port = process.env.PORT || 3000;

//important
app.use(express.json());

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = ` SELECT * FROM departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
            INSERT INTO employees(name, department_id) VAlUES ($1, $2) RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id=$2, updated_at=now()
      WHERE id=$3 RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
      DELETE from employees
      WHERE id = $1
      `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  app.listen(port, () => console.log(`listening on port ${port}`));
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255)
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    )
    `;
  client.query(SQL);
  SQL = `
    INSERT INTO departments (name) VALUES 
    ('HR'),
    ('Engineering'),
    ('Sales'),
    ('Marketing'),
    ('Finance');
    `;
  client.query(SQL);
  SQL = `
    INSERT INTO employees (name, department_id) VALUES
        ('Alice Johnson', 1),  -- HR
      ('Bob Smith', 2),      -- Engineering
      ('Charlie Davis', 2),  -- Engineering
      ('Dana Williams', 3),  -- Sales
      ('Eve Brown', 4),      -- Marketing
      ('Frank Green', 5),    -- Finance
      ('Grace Lee', 1),      -- HR
      ('Henry King', 3);     -- Sales
    `;
  client.query(SQL);
};

init();
