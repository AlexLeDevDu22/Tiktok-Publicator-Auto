const cron = require("node-cron");
const utils = require("./utils.js");
const tiktokStats = require("./tiktok-stats.js");
const https = require("https");
const http = require("http"); // Pour fetch si besoin
const { URL } = require("url");
const { DateTime } = require("luxon");

/**
 * Get the count of postings for a given account today.
 * @param {mysql2/promise} db - The MySQL database connection.
 * @param {number} accountId - The id of the account to get the postings count.
 * @returns {Promise<number>} - A promise that resolves with the count of postings.
 */
function getPostedTodayCount(db, accountId) {
  return db
    .execute(
      "SELECT COUNT(*) as count FROM publications WHERE at_account = ? AND DATE(date) = CURDATE() AND status != 'failed'",
      [accountId]
    )
    .then(([rows]) => rows[0].count);
}

/**
 * Schedule the posting for today for all accounts.
 * @param {mysql2/promise} db - The MySQL database connection.
 * @returns {Promise<void>} - A promise that resolves when all schedules have been set.
 */
async function schedulingTodayPosting(db) {
  const accounts = await utils.getAccountsData(db, "*");

  // ✅ Utiliser for...of au lieu de forEach pour éviter les race conditions
  console.log(
    "\x1b[35m%s\x1b[0m",
    "\n[Midnight] Starting scheduling for " +
      new Date().toLocaleDateString("fr-FR")
  );
  for (const account of accounts) {
    if (!account.active) continue;
    const accountColor = [
      `\x1b[40m`,
      `\x1b[41m`,
      `\x1b[42m`,
      `\x1b[43m`,
      `\x1b[44m`,
      `\x1b[45m`,
      `\x1b[46m`,
      `\x1b[47m`,
    ][account.id % 8]; // ✅ Couleurs de fond pour chaque compte
    try {
      for (let i = 0; i < account.daily_tiktok_count; i++) {
        const postedToday = await getPostedTodayCount(db, account.id);

        if (i < postedToday) {
          console.log(
            "\x1b[33m%s\x1b[0m",
            `Skipping post ${i + 1} for account ${
              accountColor + account.pseudo + "\x1b[0m"
            } - already posted for ${new Date().toLocaleDateString(
              "en-FR"
            )} (${postedToday}/${account.daily_tiktok_count})`
          );
          continue;
        }

        // ✅ Passer le last_tiktok_id actuel à hubRepost
        await hubRepost(db, account, true, accountColor, i, false);
      }
    } catch (error) {
      console.error(
        `Error processing account ${
          accountColor + account.pseudo + "\x1b[0m"
        }: `,
        error
      );
      // ✅ Continuer avec les autres comptes même si un échoue
    }
  }
}

// Main video posting function
async function hubRepost(
  db,
  account,
  possibleSchedule = true,
  accountColor = "\x1b[47m",
  turnNum,
  testMode = false
) {
  // ✅ Utiliser une transaction pour assurer l'atomicité
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // ✅ Si lastTiktokId n'est pas fourni, le récupérer
    const currentLastId = (
      await connection.query(
        "SELECT last_tiktok_id FROM accounts WHERE id = ? FOR UPDATE",
        [account.id]
      )
    )[0][0].last_tiktok_id;

    // ✅ Sélectionner la prochaine vidéo
    const [rows] = await connection.query(
      "SELECT * FROM `stored_tiktoks` WHERE `niche_id` = ? AND `id` > ? ORDER BY `id` ASC LIMIT 1",
      [account.niche_belonged, currentLastId]
    );

    if (rows.length === 0) {
      throw new Error(
        `${account.pseudo}(${account.social_media}) has reached the maximum number of videos. Last ID: ${currentLastId}`
      );
    }

    const videoToPost = rows[0];

    const now = DateTime.local().setZone("Europe/Paris");
    let schedule = null;

    if (possibleSchedule) {
      // Récupère les meilleures heures pour ce compte (déjà calculées dans schedulingTodayPosting)
      // On suppose que bestHoursToPost a été passé en paramètre ou recalculé ici si besoin
      const bestHours = await tiktokStats.bestHoursToPost(
        account,
        account.daily_tiktok_count
      );
      // Sélectionne l'heure pour ce post
      const scheduleHour =
        bestHours[turnNum % bestHours.length] || [9, 14, 19][turnNum % 3];
      // Ajoute quelques minutes aléatoires pour éviter les patterns trop fixes
      const randomMinute = Math.floor(Math.random() * 60);

      schedule = now.set({
        hour: scheduleHour,
        minute: randomMinute,
        second: 0,
        millisecond: 0,
      });

      // Si l'heure est déjà passée, ne schedule pas (ou adapte selon ta logique)
      if (schedule <= now) {
        schedule = null;
      }
    }

    // Log en heure française pour bien suivre
    console.log(
      "\x1b[34m%s\x1b[0m",
      `Processing scheduling for ${
        accountColor + account.pseudo + " \x1b[34m\x1b[0m"
      } at ${schedule ? schedule.toFormat("dd/MM/yyyy HH:mm") : "NOW"} (${
        turnNum + 1
      }/${account.daily_tiktok_count})`
    );

    // ✅ Vérifier qu'on n'a pas déjà publié cette vidéo pour ce compte
    const [existingPub] = await connection.query(
      "SELECT id FROM publications WHERE tiktok_id = ? AND at_account = ?",
      [videoToPost.id, account.id]
    );
    const isMp4 = await isVideo(videoToPost.link);

    if (!isMp4 || existingPub.length > 0) {
      if (!isMp4)
        console.warn(
          "\x1b[36m%s\x1b[0m",
          `Tiktok ${videoToPost.id} is not a video, next link...`
        );
      else
        console.warn(
          `Video ${videoToPost.id} already published for account ${
            accountColor + account.pseudo + "\x1b[0m"
          }, skipping`
        );

      const nextVideo = await connection.query(
        "SELECT * FROM `stored_tiktoks` WHERE `niche_id` = ? AND `id` > ? ORDER BY `id` ASC LIMIT 1",
        [account.niche_belonged, videoToPost.id]
      );
      await connection.query(
        "UPDATE `accounts` SET `last_tiktok_id` = ? WHERE `id` = ?",
        [nextVideo[0][0].id, account.id]
      );
      await connection.commit();
      connection.release();
      return hubRepost(
        db,
        account,
        possibleSchedule,
        accountColor,
        turnNum,
        testMode
      );
    }

    if (!testMode) {
      // ✅ Mettre à jour last_tiktok_id AVANT la publication
      await connection.query(
        "UPDATE `accounts` SET `last_tiktok_id` = ? WHERE `id` = ?",
        [videoToPost.id, account.id]
      );

      // ✅ Commit avant l'upload pour éviter les doublons même si l'upload échoue
      await connection.commit();
      connection.release();
    }

    // Récupérer les données de l'account Zapier
    const [zapierAccount] = await connection.query(
      "SELECT * FROM `zapier_accounts` WHERE `id` = ? LIMIT 1",
      [account.zapier_belonged_id]
    );

    // ✅ Upload de la vidéo
    const uploadSuccess = await uploadVideo(
      zapierAccount[0],
      account,
      videoToPost,
      schedule,
      testMode,
      db // Ajoute db ici
    );
    if (uploadSuccess) {
      console.log(
        "\x1b[32m%s\x1b[0m",
        `Video scheduled/published successfully: ${
          videoToPost.id
        } for account ${accountColor + account.pseudo}`
      );
      if (!testMode) {
        // ✅ Insérer la publication avec un statut approprié
        const publicationStatus =
          schedule && schedule > new Date() ? "scheduled" : "published";

        await connection.query(
          "INSERT INTO `publications` (`tiktok_id`, `at_account`, `description`, `date`, `status`) VALUES (?,?,?,?,?)",
          [
            videoToPost.id,
            account.id,
            videoToPost.initial_description,
            schedule ? schedule.toFormat("yyyy-MM-dd HH:mm:ss") : new Date(),
            publicationStatus,
          ]
        );
      }

      // ✅ Programmer la mise à jour du statut si c'est schedulé
      if (!testMode && schedule && schedule > new Date()) {
        const scheduleDate = new Date(schedule);
        const cronTime = `${scheduleDate.getMinutes()} ${scheduleDate.getHours()} ${scheduleDate.getDate()} ${
          scheduleDate.getMonth() + 1
        } *`;

        cron.schedule(
          cronTime,
          async () => {
            await db.query(
              "UPDATE `publications` SET `status` = 'published' WHERE `tiktok_id` = ? AND `at_account` = ?",
              [videoToPost.id, account.id]
            );
          },
          { scheduled: true }
        );
      }
    } else {
      console.error(
        `\x1b[31m%s\x1b[0m Upload failed for video ${videoToPost.id}, account ${account.pseudo}:`
      );

      if (!testMode) {
        await connection.query(
          "INSERT INTO `publications` (`tiktok_id`, `at_account`, `description`, `date`, `status`) VALUES (?,?,?,?,?)",
          [
            videoToPost.id,
            account.id,
            videoToPost.initial_description,
            schedule ? schedule.toFormat("yyyy-MM-dd HH:mm:ss") : new Date(),
            "failed",
          ]
        );
      } else process.exit(1);
    }
  } catch (error) {
    console.error(
      `Error in hubRepost for account ${account.id}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Checks if a given URL is a video.
 *
 * @param {string} url - The URL to check.
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the URL is a video or not.
 */
function isVideo(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
      },
    };

    const req = https.request(url, options, (res) => {
      resolve(res.statusCode != 404);
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Makes an HTTPS request to a given URL with optional options and data.
 *
 * @param {string} url - The URL to make the request to.
 * @param {object} [options] - Options for the request.
 * @param {string} [data] - Data to send with the request.
 * @returns {Promise} - A promise that resolves with the response data.
 */
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Rafraîchit les cookies Zapier en cas de 401.
 * @param {object} zapierAccount - L'objet zapierAccount (doit contenir email, password, account_id, id)
 * @param {object} db - Connexion MySQL2/promise
 * @returns {Promise<string>} - Les nouveaux cookies sous forme de string
 */
async function refreshZapierCookies(zapierAccount, db) {
  const loginBody = JSON.stringify({
    account_id: zapierAccount.account_id,
    email: zapierAccount.email,
    password: zapierAccount.password,
  });

  const loginOptions = {
    method: "POST",
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      baggage:
        "sentry-environment=production,sentry-release=52077a21f526ab9c79ef142b0650b01d01412e0f,sentry-public_key=44538d18b58d4a709fa09a409e48e6bc,sentry-trace_id=946e4f258ef04b08b2a3d9b61df6f699,sentry-transaction=%2Fapp%2Flogin,sentry-sampled=true,sentry-sample_rand=0.908971472501366,sentry-sample_rate=1",
      "content-type": "application/json;charset=utf-8",
      priority: "u=1, i",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sentry-trace": "946e4f258ef04b08b2a3d9b61df6f699-8e1c7db7007ae1a1-1",
      "x-csrftoken":
        "UkuNxOgdXRhjLZuU55j1MdYzmmL8bVr6qRGXyADxia7wAJFnjX0iw67br9rgFaqp",
      "x-datadog-origin": "rum",
      "x-datadog-parent-id": "1196485182785788830",
      "x-datadog-sampled": "1",
      "x-datadog-sampling-priority": "1",
      "x-datadog-trace-id": "2579412473779602913",
      "x-requested-with": "XMLHttpRequest",
      cookie:
        'zapidentity=-727112666; ssohint=anonymous; visitor_id=2061296d-6228-477e-ad74-666a95300cde; builderSessionId=56f26ca975e746a8b196430911268072; session_id=a21bd84d-94ae-4612-a9d2-426e466b4035; csrftoken=UkuNxOgdXRhjLZuU55j1MdYzmmL8bVr6qRGXyADxia7wAJFnjX0iw67br9rgFaqp; OptanonConsentInSided=C0001; intercom-id-su0xp8g6=bb194c36-32e7-42fa-826b-f51064d4e94c; intercom-session-su0xp8g6=; intercom-device-id-su0xp8g6=f17f5385-6c1c-4038-a8a7-b9d0a4ce148b; fs_lua=1.1750020393024; fs_uid=#1XM#6006ad3b-08cd-4382-912a-ae54c5847438:b65b128a-bce5-4d6d-ae8c-6fb4d595a6b3:1750020393024::1#/1781556394; OptanonConsent=isGpcEnabled=0&datestamp=Sun+Jun+15+2025+22%3A46%3A39+GMT%2B0200+(Central+European+Summer+Time)&version=202401.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=0c5ae4a4-a21f-4ada-ac37-88edacc85a58&interactionCount=1&landingPath=NotLandingPage&groups=C0004%3A0%2CC0005%3A0%2CC0002%3A0%2CC0003%3A0%2CC0001%3A1&AwaitingReconsent=false; _dd_s=aid=550487fb-065b-47f6-b1fa-27a55d901952&rum=2&id=0412d4ee-d5d8-4deb-be83-81bf98f99825&created=1907787775&expire=1907787775; signonidentity=""',
      Referer: "https://zapier.com/app/login",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  };

  // Utilise makeRequest pour POST login
  const loginResp = await makeRequest(
    "https://zapier.com/api/v3/login",
    loginOptions,
    loginBody
  );

  if (![200, 201].includes(loginResp.statusCode)) {
    throw new Error("Impossible de rafraîchir les cookies Zapier");
  }

  // Récupère tous les set-cookie
  const setCookieHeaders = loginResp.headers["set-cookie"];
  if (!setCookieHeaders)
    throw new Error("Pas de set-cookie dans la réponse Zapier");

  // Fusionne tous les cookies reçus
  let newCookies = setCookieHeaders.map((c) => c.split(";")[0]).join("; ");

  // On garde aussi les cookies qui ne sont pas dans set-cookie mais étaient déjà là (ex: intercom-id, etc)
  // On merge intelligemment (simple ici)
  const oldCookies = zapierAccount.cookies.split(";").map((c) => c.trim());
  const newCookiesArr = newCookies.split(";").map((c) => c.trim());
  const cookieMap = {};
  oldCookies.forEach((c) => {
    const [k, v] = c.split("=");
    cookieMap[k] = v;
  });
  newCookiesArr.forEach((c) => {
    const [k, v] = c.split("=");
    cookieMap[k] = v;
  });
  const mergedCookies = Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  // Update DB
  await db.query("UPDATE zapier_accounts SET cookies = ? WHERE id = ?", [
    mergedCookies,
    zapierAccount.id,
  ]);

  return mergedCookies;
}

// Modifie uploadVideo pour gérer le 401 et retry
async function uploadVideo(
  zapierAccount,
  account,
  videoToPost,
  schedule,
  testMode = false,
  db = null, // Ajoute db pour pouvoir update les cookies
  retry = false // Pour éviter boucle infinie
) {
  // Première requête PATCH
  const patchData = JSON.stringify({
    zdl: {
      app: "EngineAPI",
      type: "run",
      action: "series_skip_errors",
      id: "series_" + zapierAccount.zap_id,
      zdl_version: "0.4",
      steps: [
        {
          id: zapierAccount.zap_id.toString(),
          app: "CodeCLIAPI@1.0.1",
          type: "read",
          action: "",
          params: {},
          meta: {
            $editor: {
              has_automatic_issues: true,
            },
          },
        },
        {
          type: "write",
          app: "BufferCLIAPI@2.2.0",
          action: "update",
          id: zapierAccount.GEN_ID,
          authentication_id: zapierAccount.authentication_id,
          params: {
            method:
              schedule && schedule > new Date() ? "schedule" : "share_now",
            organizationId: zapierAccount.buffer_organization_id,
            channelId: account.id_buffer,
            scheduling_type: "direct",
            text: videoToPost.description,
            video:
              "https://www.tikwm.com/video/media/play/" +
              videoToPost.link.split("/").reverse()[0] +
              ".mp4",
            scheduled_at:
              schedule && schedule > new Date()
                ? schedule.toFormat("yyyy-MM-dd'T'HH:mm")
                : null,
            attachment: "video",
          },
          meta: {
            $editor: {
              has_automatic_issues: false,
            },
            params: {
              organizationId: {
                label: "My Organization",
              },
              channelId: {
                label: `${account.pseudo} TikTok Account`,
              },
            },
          },
        },
      ],
    },
    title: "Tiktok Reposter",
    description: "",
    legacy_node_id: null,
    is_enabled: false,
    zap_note: "",
  });

  const patchOptions = {
    method: "PATCH",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/json",
      "X-CSRFToken": zapierAccount.cookies.split("csrftoken=")[1].split(";")[0],
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0",
      Origin: "https://zapier.com",
      "Alt-Used": "zapier.com",
      Connection: "keep-alive",
      Referer:
        "https://zapier.com/editor/" +
        zapierAccount.zap_id +
        "/draft/" +
        zapierAccount.GEN_ID +
        "/sample",
      Cookie: zapierAccount.cookies,

      DNT: "1",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      TE: "trailers",
      "Sec-GPC": "1",
    },
  };

  try {
    const response = await makeRequest(
      "https://zapier.com/api/gulliver/storage/v1/zaps/" +
        zapierAccount.zap_id +
        "?account_id=" +
        zapierAccount.cookies.split("currentAccountId=")[1].split(";")[0],
      patchOptions,
      patchData
    );
    if (response.statusCode === 401 && !retry && db) {
      console.warn(
        "\x1b[33m[Zapier] Cookies expirés, rafraîchissement...\x1b[0m"
      );
      // Rafraîchir cookies
      const newCookies = await refreshZapierCookies(zapierAccount, db);
      zapierAccount.cookies = newCookies;
      // Met à jour les headers pour la nouvelle requête
      patchOptions.headers.Cookie = newCookies;
      patchOptions.headers["X-CSRFToken"] = newCookies
        .split("csrftoken=")[1]
        .split(";")[0];
      // Retry une seule fois
      return await uploadVideo(
        zapierAccount,
        account,
        videoToPost,
        schedule,
        testMode,
        db,
        true
      );
    }
    if (![200, 201].includes(response.statusCode)) {
      console.error(
        "Error patching zapier account",
        response.statusCode,
        response.data
      );
      return false;
    }

    // Deuxième requête POST
    const postOptions = {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
        "X-CSRFToken": zapierAccount.cookies
          .split("csrftoken=")[1]
          .split(";")[0],

        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0",
        DNT: "1",
        "Sec-GPC": "1",
        Origin: "https://zapier.com",
        "Alt-Used": "zapier.com",
        Connection: "keep-alive",
        Referer:
          "https://zapier.com/editor/" +
          zapierAccount.zap_id +
          "/draft/" +
          zapierAccount.GEN_ID +
          "/sample",
        Cookie: zapierAccount.cookies,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Priority: "u=0",
        TE: "trailers",
      },
    };
    if (!testMode) {
      const postResponse = await makeRequest(
        "https://zapier.com/api/gulliver/steptesting/v2/zaps/" +
          zapierAccount.zap_id +
          "/steps/" +
          zapierAccount.GEN_ID +
          "/output/test/run?account_id=" +
          zapierAccount.cookies.split("currentAccountId=")[1].split(";")[0] +
          "&origin=main",
        postOptions,
        "{}"
      );
      if (![200, 201].includes(postResponse.statusCode)) {
        console.error("error posting", postResponse.data);
        return false;
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'upload:", error.message);
    return false;
  }

  return true;
}

/**
 * Initialize the scheduling of the postings.
 * This function schedules the postings for today, and then schedule itself to be executed every day at 00:00.
 * @param {mysql2/promise} db - The MySQL database connection.
 */
function init(db) {
  schedulingTodayPosting(db);
  cron.schedule(
    "0 0 * * *",
    () => {
      schedulingTodayPosting(db);
    },
    {
      timezone: "Europe/Paris",
    }
  );
}

module.exports = { init, hubRepost };
