const { JSDOM } = require("jsdom");
const cron = require("node-cron");
const utils = require("./utils.js");

const SaveDaysStats = async (db, account) => {
  // Date de départ absolue
  const START_DATE = new Date("2023-01-03");

  // Récupère la dernière date présente en DB pour ce compte
  const [rows] = await db.query(
    "SELECT MAX(day) as last_day FROM stats_per_days WHERE account_id = ?",
    [account.id]
  );

  // Calcule la date de début : soit la dernière enregistrée + 1 jour, soit la date de départ
  let lastSavedDate = rows[0].last_day
    ? new Date(rows[0].last_day)
    : START_DATE;

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

  // Index du startDay par rapport à la date de départ (TikTok semble compter en jours depuis le 3 janvier 2023)
  const startDayIndex = Math.ceil(
    (lastSavedDate - START_DATE) / (1000 * 60 * 60 * 24)
  );

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

    console.log(
      datas
      // date.toISOString().split("T")[0],
      // account.id,
      // datas.vv_history[i]?.value || 0,
      // datas.like_history[i]?.value || 0,
      // datas.pv_history[i]?.value || 0,
      // datas.comment_history[i]?.value || 0,
      // datas.share_history[i]?.value || 0,
      // datas.net_follower_history[i]?.value || 0,
      // datas.user_rewards_data.est_rewards_diff_num[i]?.value || 0
    );
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
};

const getAllDaysStats = async (db, accountId) => {
  //get all days stats from database
  return (
    await db.query(
      "SELECT * FROM stats_per_days WHERE account_id = ? ORDER BY day ASC",
      [accountId]
    )
  )[0];
};

bestHoursToPost = async (account, n) => {
  const response = await fetch(
    'https://www.tiktok.com/aweme/v2/data/insight/?type_requests=[{"insigh_type":"viewer_active_history_hours","days":8,"end_days":1}]',
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
  const data = await response.json();

  const hours = data.viewer_active_history_hours[0].value; // heurs il y a 7 jours

  if (hours.reduce((a, b) => a + b) < 480) return [16, 19];
  let bestTimes = [];

  // Tri les heures par ordre décroissant
  const sortedHours = hours.slice().sort((a, b) => b - a);

  // Sélectionne les n premières heures
  for (let i = 0; i < sortedHours.length; i++) {
    const hour = sortedHours[i];
    const index = hours.indexOf(hour);

    // Vérifie si l'index est déjà présent dans la liste
    if (!bestTimes.includes(index)) {
      // Vérifie si l'index est séparé d'au moins 1 heure des indices précédents
      if (!bestTimes.some((prevIndex) => Math.abs(prevIndex - index) < 2)) {
        bestTimes.push(index);
        // Si on a trouvé les n heures, on arrête
        if (bestTimes.length === n) break;
      }
    }
  }
  return bestTimes;
};

async function init(db) {
  (await utils.getAccountsData(db, "*")).forEach((account) => {
    SaveDaysStats(db, account);
    cron.schedule("0 0 * * *", () => {
      SaveDaysStats(db, account);
    });
  });
}

module.exports = {
  SaveDaysStats,
  getAllDaysStats,
  bestHoursToPost,
  init,
};
