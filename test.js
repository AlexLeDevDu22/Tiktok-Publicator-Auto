const url =
  "https://zapier.com/api/gulliver/steptesting/v2/zaps/301216766/steps/301216767/output/test/run?account_id=23122194&origin=main";

const options = {
  method: "POST",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Content-Type": "application/json",
    "X-CSRFToken":
      "DLN7lcdfTaQjF8cpXSBnmcLy6k3hl9IXH1FuotwlHnzmzR6BImWd7beUl4nENC2i",
    traceparent: "00-0000000000000000c0eab31d3d49b07f-41b5f2cb4487d3e3-01",
    Origin: "https://zapier.com",
    DNT: "1",
    "Sec-GPC": "1",
    Connection: "keep-alive",
    Referer: "https://zapier.com/editor/301216766/draft/301216767/sample",
    Cookie:
      "visitor_id=14ef8417-0b03-4365-a685-052b9c6301b9; zapidentity=-747798335; ssohint=d3214ea5-3dc2-423c-a584-64fede6ddbc0; csrftoken=DLN7lcdfTaQjF8cpXSBnmcLy6k3hl9IXH1FuotwlHnzmzR6BImWd7beUl4nENC2i; OptanonConsent=isGpcEnabled=1&datestamp=Mon+Jun+02+2025+09%3A48%3A38+GMT%2B0200+(Central+European+Summer+Time)&version=202401.1.0&browserGpcFlag=1&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0005%3A0%2CC0004%3A0%2CC0003%3A0%2CC0002%3A0%2CC0001%3A1&AwaitingReconsent=false&consentId=143a65bb-acff-4d25-8a45-6a3e15ef2679&interactionCount=1&geolocation=PL%3B14; OptanonConsentInSided=C0001; zapha=true; billing_downgrade_flow_reorder=1; ssoid=eyJzayI6ImdBQUFBQUJvUFZldWdaZ2NRNjdwTHgyX3ctWlZaOFdfck50UmY5dXJhbDZ0TVVUWG12ZGRlSDVld25GWGd5U2haNnJnYVNjODlLQkt6WWNmV09malZzN1dwRm9nS1VLaWRUMDd3UGhTd2tid3dFal8xcmxXZk1wdk05YUFxMEJKTm5rcFBtZ21DUnhmIiwiY2lkIjoyMzE3NTE1M30:1uLzvq:5KKMYSRApW2q-1aPmsFFpJzBL-WvMycClZYGY0l9AgQ; NPS_180ad05e_last_seen=1748810189823; intercom-id-su0xp8g6=3b9af16c-7362-46cf-ab29-6ce69d1986c1; intercom-session-su0xp8g6=aXdZTGEvdUhydnNwZVo4LzcxajVNT091THgxazRCTy9UaS9scWRTREIvNmdMdjU1cGVkR0RZUlYva2p3YmtEcXNSU0FmTGhxWTZ2OWpMTFJTM3lMMlhTNEdoWGdNeUxBTGJaOFd1ZGFEQzQ9LS1WbU82a1ZiYUFnVHJmWUloRXFuUTVRPT0=--5ae0d4b24dacec098f4ab3704fb18e15124ff714; intercom-device-id-su0xp8g6=592ced10-2ff8-4559-b193-cd12a10a8509; AMP_66c1d651b8=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIzMGNiODE2ZC0yYzVkLTQ0ZTItOWMzNy0xODFlNzliZDYxM2YlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIyMzE3NTE1MyUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDg4NTAzNzc3MTElMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4ODUwNTA4MjU3JTJDJTIybGFzdEV2ZW50SWQlMjIlM0ExMTElMkMlMjJwYWdlQ291bnRlciUyMiUzQTAlN0Q=; session_id=84db583d-ec88-4a49-bb35-29c1d987ab0e; _dd_s=aid=bc281471-623f-4be5-b65d-b98d1efcc770&logs=1&id=68507e4f-6f09-4aaa-8df4-c75932c745fb&created=1748850377551&expire=1748851508955&rum=2; OptanonAlertBoxClosed=2025-06-02T07:47:21.567Z; builderSessionId=de553173e78a4eb5be6dde45bd7046cd; currentAccountId=23122194; signonidentity=REVQUkVDQVRFRA; zapsession=05i8mh922zx5ss5zcar6qxlykx1sza70",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    Priority: "u=0",
    TE: "trailers",
  },
  body: JSON.stringify({}),
};

// Utilisation avec async/await
async function makeRequest() {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

makeRequest();
