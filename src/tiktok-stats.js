const cron = require("node-cron");
const utils = require("./utils.js");

/**
 * Sauvegarde les stats par jours pour un compte TikTok
 *
 * @param {import("mysql2").PromisePool} db - La connexion à la base de données
 * @param {{id: number, sessionid: string}} account - Le compte TikTok
 */
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
    `https://www.tiktok.com/aweme/v2/data/insight/?type_requests=[
      {"insigh_type":"vv_history","days":${daysToFetch},"end_days":1},
      {"insigh_type":"pv_history","days":${daysToFetch},"end_days":1},
      {"insigh_type":"like_history","days":${daysToFetch},"end_days":1},
      {"insigh_type":"comment_history","days":${daysToFetch},"end_days":1},
      {"insigh_type":"share_history","days":${daysToFetch},"end_days":1},
      {"insigh_type":"net_follower_history","days":${daysToFetch},"end_days":1},
      {"insigh_type": "user_rewards_data", "days": ${daysToFetch}, "end_days": 1}
    ]`,
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
        cookie: `sessionid=${account.sessionid}`,
      },
    }
  );

  const datas = await response.json();
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

/**
 * Get all days stats from database
 * @param {import("mysql2").Pool} db - database connection
 * @param {number} accountId - id of the account to get stats
 * @returns {Promise<Array<import("./db-types").StatsPerDay>>} - array of stats
 */
async function getAllDaysStats(db, accountId) {
  //get all days stats from database
  return (
    await db.query(
      "SELECT * FROM stats_per_days WHERE account_id = ? ORDER BY day ASC",
      [accountId]
    )
  )[0];
}

function getPostedTime(videoId) {
  const VideoId = BigInt(videoId);

  // Extraire les 31 bits de timestamp (en secondes)
  const timestampSeconds = Number(VideoId >> 32n);

  // Convertir en millisecondes
  const timestampMillis = timestampSeconds * 1000;

  // Créer un objet Date (locale = France si exécuté en France)
  const localDate = new Date(timestampMillis);

  return localDate;
}

async function getTotalFollowers(db, accountId) {
  const account = await utils.getAccountsData(db, accountId);
  if (!account.sessionid || account.sessionid === "") return 0;
  const response = await fetch(
    `https://www.tiktok.com/aweme/v2/data/insight/?type_requests=[
      {"insigh_type":"follower_num"}
    ]`,
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
        cookie: `sessionid=${account.sessionid}`,
      },
    }
  );

  return (await response.json()).follower_num.value || 0;
}

async function init(db) {
  const accounts = await utils.getAccountsData(db, "*");

  for (const account of accounts) {
    await SaveDaysStats(db, account);
  }

  cron.schedule("0 0 * * *", async () => {
    const accounts = await utils.getAccountsData(db, "*");

    for (const account of accounts) {
      await SaveDaysStats(db, account);
    }
  });
}

module.exports = {
  SaveDaysStats,
  getAllDaysStats,
  getPostedTime,
  getTotalFollowers,
  init,
};
