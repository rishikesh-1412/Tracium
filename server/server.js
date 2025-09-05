const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // using promise-based MySQL client

const app = express();
const port = 5000;

app.use(express.json());

app.use(cors());

// ---- MySQL connection config ----
const dbConfig = {
  host: "localhost", // or your DB host
  user: "rishikesh",
  password: "password",
  database: "observium",
};

// ---- API ----
app.get("/datatrail/productMapping/:productName", async (req, res) => {
  const { productName } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Query to fetch dependencies dynamically
    const [rows] = await connection.execute(
      `
      SELECT view_name AS view, input_view_name AS input, raw_input
      FROM view_dependencies
      WHERE view_name IN (
        SELECT view_name FROM views WHERE product_name = ?
      )
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

app.get("/datatrail/list/products", async (req, res) => {
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

// app.post("/datatrail/healthCheck/:productName", async (req, res) => {
//   const { productName } = req.params;
//   const { startDate, endDate } = req.body; // both are in "YYYY-MM-DD-HH"

//   try {
//     const connection = await mysql.createConnection(dbConfig);

//     // Fetch jobs for the product
//     const [jobs] = await connection.execute(
//       `SELECT view_name AS jobName, LOWER(frequency) AS frequency
//        FROM views
//        WHERE product_name = ?`,
//       [productName]
//     );

//     const dailyJobs = jobs.filter((j) => j.frequency === "daily");
//     const hourlyJobs = jobs.filter((j) => j.frequency === "hourly");

//     const results = [];

//     // ---------- DAILY ----------
//     if (dailyJobs.length > 0) {
//       const dailyStart = startDate.substring(0, 10);
//       const dailyEnd = endDate.substring(0, 10);

//       console.log(dailyStart, dailyEnd);

//       const expectedDays = [];
//       const start = new Date(dailyStart);
//       const end = new Date(dailyEnd);
//       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//         expectedDays.push(d.toISOString().slice(0, 10));
//       }

//       const [dailyRows] = await connection.execute(
//         `
//         SELECT jobName,
//                COUNT(DISTINCT reportTime) AS presentCount,
//                GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
//         FROM job_stage_stats
//         WHERE reportTime BETWEEN ? AND ?
//           AND jobName IN (?)
//         GROUP BY jobName
//         `,
//         [dailyStart, dailyEnd, dailyJobs.map((j) => j.jobName)]
//       );

//       const dailyMap = {};
//       for (let row of dailyRows) {
//         dailyMap[row.jobName] = {
//           presentCount: row.presentCount,
//           presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
//         };
//       }

//       console.log(dailyMap.length)

//       for (const job of dailyJobs) {
//         const jobData = dailyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
//         let absent = [];

//         if (jobData.presentCount < expectedDays.length) {
//           absent = expectedDays.filter((x) => !jobData.presentEntries.includes(x));
//         }

//         results.push({
//           jobName: job.jobName,
//           frequency: "daily",
//           expectedCount: expectedDays.length,
//           presentCount: jobData.presentCount,
//           presentEntries: jobData.presentEntries,
//           absentEntries: absent,
//         });
//       }
//     }

//     // // ---------- HOURLY ----------
//     // if (hourlyJobs.length > 0) {
//     //   const expectedHours = [];
//     //   const start = new Date(startDate.replace(/-/g, "/") + ":00:00");
//     //   const end = new Date(endDate.replace(/-/g, "/") + ":00:00");
//     //   for (let d = new Date(start); d <= end; d.setHours(d.getHours() + 1)) {
//     //     const yyyy = d.getFullYear();
//     //     const mm = String(d.getMonth() + 1).padStart(2, "0");
//     //     const dd = String(d.getDate()).padStart(2, "0");
//     //     const hh = String(d.getHours()).padStart(2, "0");
//     //     expectedHours.push(`${yyyy}-${mm}-${dd}-${hh}`);
//     //   }

//     //   const [hourlyRows] = await connection.execute(
//     //     `
//     //     SELECT jobName,
//     //            COUNT(DISTINCT reportTime) AS presentCount,
//     //            GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
//     //     FROM job_stage_stats
//     //     WHERE reportTime BETWEEN ? AND ?
//     //       AND jobName IN (?)
//     //     GROUP BY jobName
//     //     `,
//     //     [startDate, endDate, hourlyJobs.map((j) => j.jobName)]
//     //   );

//     //   const hourlyMap = {};
//     //   for (let row of hourlyRows) {
//     //     hourlyMap[row.jobName] = {
//     //       presentCount: row.presentCount,
//     //       presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
//     //     };
//     //   }

//     //   for (const job of hourlyJobs) {
//     //     const jobData = hourlyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
//     //     let absent = [];

//     //     if (jobData.presentCount < expectedHours.length) {
//     //       absent = expectedHours.filter((x) => !jobData.presentEntries.includes(x));
//     //     }

//     //     results.push({
//     //       jobName: job.jobName,
//     //       frequency: "hourly",
//     //       expectedCount: expectedHours.length,
//     //       presentCount: jobData.presentCount,
//     //       presentEntries: jobData.presentEntries,
//     //       absentEntries: absent,
//     //     });
//     //   }
//     // }

//     await connection.end();

//     res.json({ productName, results });
//   } catch (err) {
//     console.error("Error in healthCheck:", err);
//     res.status(500).json({ error: "Failed to fetch health check" });
//   }
// });


app.post("/datatrail/healthCheck/:productName", async (req, res) => {
  const { productName } = req.params;
  const { startDate, endDate } = req.body; // both are in "YYYY-MM-DD-HH"

  try {
    const connection = await mysql.createConnection(dbConfig);

    await connection.query("SET SESSION group_concat_max_len = 1000000");

    // Fetch jobs for the product
    const [jobs] = await connection.execute(
      `SELECT view_name AS jobName, LOWER(frequency) AS frequency
       FROM views
       WHERE product_name = ?`,
      [productName]
    );

    const dailyJobs = jobs.filter((j) => j.frequency === "daily");
    const hourlyJobs = jobs.filter((j) => j.frequency === "hourly");

    const results = [];

    // ---------- DAILY ----------
    if (dailyJobs.length > 0) {
      const dailyStart = startDate.substring(0, 10);
      const dailyEnd = endDate.substring(0, 10);

      // console.log("Daily timeframe:", dailyStart, "→", dailyEnd);

      const expectedDays = [];
      const start = new Date(dailyStart);
      const end = new Date(dailyEnd);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        expectedDays.push(d.toISOString().slice(0, 10));
      }

      const dailySql = `
        SELECT jobName,
               COUNT(DISTINCT reportTime) AS presentCount,
               GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
        FROM job_stage_stats
        WHERE reportTime BETWEEN ? AND ?
          AND jobName IN (?)
        GROUP BY jobName
      `;
      const dailyParams = [dailyStart, dailyEnd, dailyJobs.map((j) => j.jobName)];

      // 👇 Log the fully formatted query
      // console.log("Executing SQL:", connection.format(dailySql, dailyParams));

      const [dailyRows] = await connection.execute(connection.format(dailySql, dailyParams));

      // console.log(dailyRows)

      const dailyMap = {};
      for (let row of dailyRows) {
        dailyMap[row.jobName] = {
          presentCount: row.presentCount,
          presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
        };
      }

      // console.log(dailyMap)

      for (const job of dailyJobs) {
        const jobData = dailyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
        let absent = [];

        if (jobData.presentCount < expectedDays.length) {
          absent = expectedDays.filter((x) => !jobData.presentEntries.includes(x));
        }

        results.push({
          jobName: job.jobName,
          frequency: "daily",
          // expectedCount: expectedDays.length,
          // presentCount: jobData.presentCount,
          // presentEntries: jobData.presentEntries,
          absentEntries: absent,
        });
      }
    }


    // ---------- HOURLY ----------
    if (hourlyJobs.length > 0) {
      const expectedHours = [];
      const start = new Date(startDate.replace(/-/g, "/") + ":00:00");
      const end = new Date(endDate.replace(/-/g, "/") + ":00:00");
      for (let d = new Date(start); d <= end; d.setHours(d.getHours() + 1)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        expectedHours.push(`${yyyy}-${mm}-${dd}-${hh}`);
      }

      const hourlySql = `
        SELECT jobName,
               COUNT(DISTINCT reportTime) AS presentCount,
               GROUP_CONCAT(DISTINCT reportTime) AS presentEntries
        FROM job_stage_stats
        WHERE reportTime BETWEEN ? AND ?
          AND jobName IN (?)
        GROUP BY jobName
      `;
      const hourlyParams = [startDate, endDate, hourlyJobs.map((j) => j.jobName)];

      // 👇 Log the fully formatted query
      // console.log("Executing SQL:", connection.format(hourlySql, hourlyParams));

      const [hourlyRows] = await connection.execute(connection.format(hourlySql, hourlyParams));

      // console.log(hourlyRows)

      const hourlyMap = {};
      for (let row of hourlyRows) {
        hourlyMap[row.jobName] = {
          presentCount: row.presentCount,
          presentEntries: row.presentEntries ? row.presentEntries.split(",") : [],
        };
      }

      for (const job of hourlyJobs) {
        const jobData = hourlyMap[job.jobName] || { presentCount: 0, presentEntries: [] };
        let absent = [];

        if (jobData.presentCount < expectedHours.length) {
          absent = expectedHours.filter((x) => !jobData.presentEntries.includes(x));
        }

        results.push({
          jobName: job.jobName,
          frequency: "hourly",
          // expectedCount: expectedHours.length,
          // presentCount: jobData.presentCount,
          // presentEntries: jobData.presentEntries,
          absentEntries: absent,
        });
      }
    }


    await connection.end();

    res.json({ productName, results });
  } catch (err) {
    console.error("Error in healthCheck:", err);
    res.status(500).json({ error: "Failed to fetch health check" });
  }
});



// Start server
app.listen(port, () => {
  console.log(`DataTrail API running at http://localhost:${port}`);
});
