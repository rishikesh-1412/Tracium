const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // using promise-based MySQL client

const {processMonthlyJobs} = require("./monthlyProcessing");
const {processHourlyJobs} = require("./hourlyProcessing");
const {processDailyJobs} = require("./dailyProcessing");
const {processCustomHourlyJobs} = require("./customHourlyProcessing")
const {processWeeklyJobs} = require("./weeklyProcessing")

const app = express();

require('dotenv').config();


const server_port = process.env.PORT || 5000;

app.use(express.json());

app.use(cors());

// ---- MySQL connection config ----
const dbConfig = {
  // host: "localhost", // or your prod DB host
  // user: "rishikesh",
  // password: "password",
  // database: "observium",
  // port: 3306

  host: process.env.DB_HOST || 'host.docker.internal',
  user: process.env.DB_USER || 'rishikesh',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'observium',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
};


//api to get mapping of all jobs for specific product
app.get("/tracium/productMapping/:productName", async (req, res) => {
  const { productName } = req.params;
  // const { startDate, endDate } = req.query;

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Query to fetch dependencies dynamically
    const [rows] = await connection.execute(
      `
      SELECT 
          v.view_name AS view, 
          vd.input_view_name AS input, 
          vd.raw_input
      FROM 
          views v
      LEFT JOIN 
          view_dependencies vd 
          ON v.view_name = vd.view_name
      WHERE 
          v.product_name = ? 
          AND v.is_active = 'true'
      `,
      [productName]
    );

    await connection.end();

    res.json({
      productName,
      dependencies: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data from database" });
  }
});


// api for getting all available products list
app.get("/tracium/list/products", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Query to fetch distinct product names
    const [rows] = await connection.execute(`
      SELECT DISTINCT product_name
      FROM views 
    `);

    await connection.end();

    res.json({
      products: rows
    });
  } catch (err) {
    console.error("Error fetching product list:", err);
    res.status(500).json({ error: "Failed to fetch data from database" });
  }
});

app.get("/tracium/list/views/:productName", async (req, res) => {
  try {
    const { productName } = req.params;

    const connection = await mysql.createConnection(dbConfig);

    // Query to fetch distinct product names
    const [rows] = await connection.execute(`
      SELECT * from views where product_name = ?`, [productName]);

    await connection.end();

    res.json({
      products: rows
    });
  } catch (err) {
    console.error("Error fetching product list:", err);
    res.status(500).json({ error: "Failed to fetch data from database" });
  }
});


app.get("/tracium/list/view_dependency/:productName", async (req, res) => {
  try {
    const { productName } = req.params;

    const connection = await mysql.createConnection(dbConfig);

    // Query to fetch distinct product names
    const [rows] = await connection.execute(`
      SELECT * from view_dependencies where view_name in (select view_name from views where product_name = ?)`, [productName]);

    await connection.end();

    res.json({
      products: rows
    });
  } catch (err) {
    console.error("Error fetching product list:", err);
    res.status(500).json({ error: "Failed to fetch data from database" });
  }
});


app.put("/tracium/update/view_dependency/:viewName", async (req, res) => {
  const { viewName } = req.params;
  const { inputViews, rawInputs } = req.body; // comma separated strings

  try {

    const connection = await mysql.createConnection(dbConfig);

    // 1️⃣ Delete existing dependencies
    await connection.execute("DELETE FROM view_dependencies WHERE view_name = ?", [viewName]);

    // 2️⃣ Prepare new entries
    const newEntries = [];

    if (inputViews) {
      inputViews.split(",").forEach(input => {
        newEntries.push([viewName, input.trim(), null]);
      });
    }

    if (rawInputs) {
      rawInputs.split(",").forEach(raw => {
        newEntries.push([viewName, null, raw.trim()]);
      });
    }

    // 3️⃣ Insert new dependencies
    if (newEntries.length > 0) {
      const placeholders = newEntries.map(() => "(?, ?, ?)").join(", ");
      const flatValues = newEntries.flat();
      await connection.execute(
        `INSERT INTO view_dependencies (view_name, input_view_name, raw_input) VALUES ${placeholders}`,
        flatValues
      );
    }

    // 4️⃣ Send response
    res.json({
      status: "success",
      message: `Dependencies updated successfully for job ${viewName}`,
      insertedRows: newEntries.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to update dependencies" });
  }
});


// update view activeness
app.put("/tracium/update/activeness/:viewName", async (req, res) => {
  const { viewName } = req.params;
  const { valueToSet } = req.body; // comma separated strings

  try {

    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
        `UPDATE views SET is_active = '${valueToSet}' WHERE view_name = '${viewName}'`
    );

    // Send response
    res.json({
      status: "success",
      message: `View details updated successfully for job ${viewName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to update dependencies" });
  }
});


// update view monitoring
// update job details
app.put("/tracium/update/monitoring/:viewName", async (req, res) => {
  const { viewName } = req.params;
  const { valueToSet } = req.body; // comma separated strings

  try {

    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
        `UPDATE views SET monitoring_level = ${valueToSet} WHERE view_name = '${viewName}'`
    );

    // Send response
    res.json({
      status: "success",
      message: `View details updated successfully for job ${viewName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to update dependencies" });
  }
});



// api for health check of all frequency jobs
app.post("/tracium/healthCheck/:productName", async (req, res) => {
  const { productName } = req.params;
  const { startDate, endDate } = req.body; // both are in "YYYY-MM-DD-HH"

  try {
    const connection = await mysql.createConnection(dbConfig);

    await connection.query("SET SESSION group_concat_max_len = 1000000");

    // Fetch jobs for the product
    const [jobs] = await connection.execute(
      `SELECT view_name AS jobName, LOWER(frequency) AS frequency
       FROM views
       WHERE product_name = ? AND is_active = 'true'`,
      [productName]
    );

    const dailyJobs = jobs.filter((j) => j.frequency === "daily");
    const hourlyJobs = jobs.filter((j) => j.frequency === "hourly");
    const customHourlyJobs = jobs.filter((j) => j.frequency && j.frequency.includes("-hourly"));
    const monthlyJobs = jobs.filter((j) => j.frequency === "monthly");
    const weeklyJobs = jobs.filter((j) => j.frequency === 'weekly');

    const results = [];

    // ---------- DAILY ----------
    if (dailyJobs.length > 0) {
      await processDailyJobs(dailyJobs, startDate, endDate, connection, results);
    }

    // ---------- HOURLY ----------
    if (hourlyJobs.length > 0) {
      await processHourlyJobs(hourlyJobs, startDate, endDate, connection, results);
    }

    //----------CUSTOM HOURLY ----------
    if (customHourlyJobs.length > 0) {
      await processCustomHourlyJobs(customHourlyJobs, startDate, endDate, connection, results);
    }

    // MONTHLY Processing
    if (monthlyJobs.length > 0) {
      await processMonthlyJobs(monthlyJobs, startDate, endDate, connection, results);
    }

    // WEEKLY Processing
    if(weeklyJobs.length > 0){
        await processWeeklyJobs(weeklyJobs, startDate, endDate, connection, results);
    }

    await connection.end();

    res.json({ productName, results });
  } catch (err) {
    console.error("Error in healthCheck:", err);
    res.status(500).json({ error: "Failed to fetch health check" });
  }
});


app.listen(server_port, '0.0.0.0', () => {
  console.log(`Tracium API running at http://0.0.0.0:5000`);
  console.log(`Connected to MySQL ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});

