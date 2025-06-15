async function main() {
  const response = await fetch("https://zapier.com/api/v3/login", {
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
    body: '{"account_id":23122194,"email":"mrpoil.com@gmail.com","password":"Lilaym11/0808"}',
    method: "POST",
  });

  console.log(response);
}

main();
