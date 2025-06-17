const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const tiktokStats = require("./tiktok-stats.js");
const postingManager = require("./posting-manager.js");
const { getAccountsData } = require("./utils.js");
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());

//! database connection
const pool = mysql.createPool({
  host: "raspberrypi.local",
  user: "nodejs",
  password: "",
  database: "repost_data",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool.promise();

// POST endpoint
app.post("/post-video", async (req, res) => {
  try {
    const account = await db.query("SELECT * FROM accounts WHERE id = ?", [
      req.body.account_id,
    ]);
    const result = await postingManager.hubRepost(
      db,
      account,
      !req.body.now,
      null,
      0
    );
    res.status(200).json({ message: result });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Erreur : " + error.message });
  }
});

app.get("/stats", async (req, res) => {
  const accountId = req.query.account;
  let allDaysStats = await tiktokStats.getAllDaysStats(db, accountId);
  const formattedStats = {
    likes: [],
    follows: [],
    views: [],
    comments: [],
    shares: [],
    pv: [],
    rewards: [],
  };
  allDaysStats.forEach((stat) => {
    formattedStats.likes.push(stat.likes);
    formattedStats.follows.push(stat.follows);
    formattedStats.views.push(stat.views);
    formattedStats.comments.push(stat.comments);
    formattedStats.shares.push(stat.shares);
    formattedStats.pv.push(stat.pv);
    formattedStats.rewards.push(stat.rewards);
  });
  formattedStats.totalFollowers = await tiktokStats.getTotalFollowers(
    db,
    accountId
  );
  return res.status(200).json(formattedStats);
});

app.get("/accounts", async (req, res) => {
  return res.status(200).json(await getAccountsData(db, "*", true));
});

// HTTP Server
app.listen(port, () => {
  console.log(
    "\x1b[35m%s\x1b[0m",
    `Server running on http://localhost:${port}`
  );
});

postingManager.init(db);
tiktokStats.init(db);

module.exports = { db };
