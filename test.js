async function main() {
  const sessionid = "0ccf2d6ec28d29bc499914ba0e161d13";
  const daysToFetch = 7; // Change this to the number of days you want to fetch
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
        cookie: `sessionid=${sessionid}`,
      },
    }
  );

  console.log(await response.json());
}

main();
