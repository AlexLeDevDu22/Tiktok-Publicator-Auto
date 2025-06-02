const url =
  "https://zapier.com/api/gulliver/steptesting/v2/zaps/299667490/steps/_GEN_1748188434247/output/test/run?account_id=18124313&origin=main";

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
      "hEQamwERXQR6574RHcvanvbx28Lfsm32Pjmf3XbpWHZeV7nHiPtW0H2skMDe5Zzc",
    traceparent: "00-0000000000000000f0ee2a38bdce0e41-333962077e6ae86d-01",
    Origin: "https://zapier.com",
    "Alt-Used": "zapier.com",
    Connection: "keep-alive",
    Referer:
      "https://zapier.com/editor/299667490/draft/_GEN_1748188434247/sample",
    Cookie:
      "visitor_id=7d9a6b21-dda1-4c26-a5ee-79e9d457338d; zapidentity=-756356569; ssohint=d6e4662f-7f0c-463a-8a95-128f24e8991f; zapha=true; csrftoken=hEQamwERXQR6574RHcvanvbx28Lfsm32Pjmf3XbpWHZeV7nHiPtW0H2skMDe5Zzc; ssoid=eyJzayI6ImdBQUFBQUJvUFV1ZmtxakVlRWZUWm8xNG5KZDM4ZzM1SkVlQU1MajE3ZjlMOGZ5TGktZlVWT3lVdU5XTHQ5RllZVUNNbVllUXlxNEo3dnpTT2oxZHNNWEpJNUJZYkJNVFp2VWVMeFFYOUhTX3ZBczdZbjRGbzZqUzZYNl96ZFp5cDlWTVVaZ2NhTUZYIiwiY2lkIjoxODEyNDI2OX0:1uLz83:UARiBATLQ3HWPR9ZixYHjeq_H441TF4u3gcaIJsjBTM; signonidentity=REVQUkVDQVRFRA; AMP_66c1d651b8=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIyN2RkOTdmMS03MzA5LTQ2YjMtYTI3MS00YjZlMzUzMzE4OGElMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIxODEyNDI2OSUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NDg4NDc1MTAzMzIlMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzQ4ODQ3NTEyMjE5JTJDJTIybGFzdEV2ZW50SWQlMjIlM0EzMjAlMkMlMjJwYWdlQ291bnRlciUyMiUzQTAlN0Q=; AMP_MKTG_66c1d651b8=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRmFjY291bnRzLmdvb2dsZS5jb20lMkYlMjIlMkMlMjJyZWZlcnJpbmdfZG9tYWluJTIyJTNBJTIyYWNjb3VudHMuZ29vZ2xlLmNvbSUyMiU3RA==; intercom-id-su0xp8g6=f0158741-0bc2-41f2-882d-a7aba47b21e8; intercom-session-su0xp8g6=RmNsemx4eXNxLytocm1wTFpPS05PcWYwT3V6RnlQRlFxazNBOGhtYTJ1bDNNVXdMMlBjcE1iN0Z6ZllrNjh6K1NXSUNSMnl0YVdUVVoxY3ZqQ2M1NFFyeGdqbTdIR0lwdHRHU2JUY051UGc9LS1IRi81SnJ4U1dsRTVqQk5odUwvTWVnPT0=--e3bebe5ee2501752ed83b8431ca960c3976e2f57; intercom-device-id-su0xp8g6=c18c9ded-10df-4925-956c-c0859c4c7253; OptanonConsent=isGpcEnabled=0&datestamp=Mon+Jun+02+2025+02%3A43%3A16+GMT%2B0200+(Central+European+Summer+Time)&version=202401.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&landingPath=NotLandingPage&groups=C0004%3A1%2CC0005%3A1%2CC0002%3A1%2CC0003%3A1%2CC0001%3A1&AwaitingReconsent=false; OptanonConsentInSided=C0005; *gcl*au=1.1.141136851.1748188445; fs_uid=#1XM#df50416c-68b8-44d3-a18c-9a3bb2cd198d:ad4e82dc-619d-4d11-af77-50066525b045:1748847512888::1#a484bb1c#/1779724549; *tt*enable_cookie=1; *ttp=01JW42DG1W4MWMC0M9FEHNWB77*.tt.1; ttcsid_CCLOU5BC77U1QCQHCUEG=1748847519580::IEne6LpqDyfeVoKTCrjW.9.1748847519785; ttcsid=1748847519581::_JxZdZhapaCUkIGCzsi_.9.1748847519581; *gcl*aw=GCL.1748730247.Cj0KCQjw0erBBhDTARIsAKO8iqSJpFOcJNkTI7SedxhUzDEp1dh6t7-9z4Qdfly5ElLL2HgGQeJXkPoaAmPZEALw_wcB; *gcl*gs=2.1.k1$i1748730238$u73046680; NPS_180ad05e_last_seen=1748189438275; NPS_edfb676e_last_seen=1748534323815; *pvd*uid=1.11-1ocudapa-mbctqobs; billing_downgrade_flow_reorder=1; lastVisitedPage=plans; currentAccountId=18124313; zapsession=7ebdi4oeo8tkgp1n15dke7icl2dswl60; fs_lua=1.1748847512888; session_id=5dfa52dd-57f6-4d17-a07a-f0b204e511d2; *dd*s=aid=b0df5d25-8095-4420-8bf0-e98f3cc25190&logs=1&id=785df3e0-d03c-4b88-9a1b-16e9503a6766&created=1748847510145&expire=1748848414422&rum=1; *uetsid=3a0cc1c03e1511f08a89cb1e3c147aed; *uetvid=7cd6c000398011f091ce37c3d3808f85",
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
