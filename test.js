const mysql = require("mysql2");

async function SaveDaysStats(db, account) {
  if (!account.sessionid || account.sessionid === "") return;
  // Récupère la dernière date présente en DB pour ce compte
  const [rows] = await db.query(
    "SELECT MAX(day) as last_day FROM stats_per_days WHERE account_id = ?",
    [account.id]
  );

  // Calcule la date de début : soit la dernière enregistrée + 1 jour, soit la date de départ
  let lastSavedDate = rows[0].last_day
    ? new Date(rows[0].last_day)
    : account.created_at;

  // +1 jour pour commencer au jour suivant
  lastSavedDate.setDate(lastSavedDate.getDate() + 1);

  // Date d’hier (car TikTok ne donne pas les stats du jour même)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Nombre de jours à fetch
  const daysToFetch =
    Math.floor((yesterday - lastSavedDate) / (1000 * 60 * 60 * 24)) + 1;

  if (daysToFetch <= 0) {
    return;
  }

  const response = await fetch(
    // `https://www.tiktok.com/aweme/v2/data/insight/?type_requests=[
    //   {"insigh_type":"vv_history","days":${daysToFetch},"end_days":1},
    //   {"insigh_type":"pv_history","days":${daysToFetch},"end_days":1},
    //   {"insigh_type":"like_history","days":${daysToFetch},"end_days":1},
    //   {"insigh_type":"comment_history","days":${daysToFetch},"end_days":1},
    //   {"insigh_type":"share_history","days":${daysToFetch},"end_days":1},
    //   {"insigh_type":"net_follower_history","days":${daysToFetch},"end_days":1},
    //   {"insigh_type": "user_rewards_data", "days": ${daysToFetch}, "end_days": 1}
    // ]`,
    'https://www.tiktok.com/aweme/v2/data/insight/?locale=en&aid=1988&priority_region=JP&region=FR&tz_name=Europe/Paris&app_name=tiktok_creator_center&app_language=en&device_platform=web_pc&channel=tiktok_web&device_id=7498845605659215382&os=win&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=Linux x86_64&browser_name=Mozilla&browser_version=5.0 (X11; Ubuntu)&tz_offset=7200&type_requests=[{"insigh_type":"top_items","range":1,"filter":1}]',
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
        cookie: `sessionid=8eef67df96e84090757d3f8e16df03ab`,
      },
    }
  );

  const datas = await response.json();
  console.log(datas);
  for (let i = 0; i < daysToFetch; i++) {
    const date = new Date(lastSavedDate);
    date.setDate(date.getDate() + i);

    await db.query(
      "INSERT INTO `stats_per_days` (day, account_id, views, likes, pv, comments, shares, follows, rewards) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        date.toISOString().split("T")[0],
        account.id,
        datas.vv_history[i]?.value || 0,
        datas.like_history[i]?.value || 0,
        datas.pv_history[i]?.value || 0,
        datas.comment_history[i]?.value || 0,
        datas.share_history[i]?.value || 0,
        datas.net_follower_history[i]?.value || 0,
        datas.user_rewards_data.est_rewards_diff_num[i]?.value || 0,
      ]
    );
  }
}

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

db.query("SELECT * FROM accounts LIMIT 1").then(([accounts]) => {
  SaveDaysStats(db, accounts[0])
    .then(() => {
      console.log("Stats saved successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error saving stats:", error);
      process.exit(1);
    });
});
