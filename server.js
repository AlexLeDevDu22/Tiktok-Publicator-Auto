const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const hubRepost = require("./reposter/hub-repost.js");
const tiktokStats = require("./tiktok-stats.js");
const postingManager = require("./posting-manager.js");
const { getAccountsData } = require("./utils.js");
const { get } = require("http");
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "GUI")));
app.use(express.json());

//! database connection
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
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
    const account = "love.comptabilitys";
    const result = await hubRepost.hubRepost(db, account);
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
  return res.status(200).json(formattedStats);
});

app.get("/accounts", async (req, res) => {
  return res.status(200).json(await getAccountsData(db, "*"));
});

postingManager.init(db);
tiktokStats.init(db);

// HTTP Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = { db };
