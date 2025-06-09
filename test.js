function decodeTikTokTimestamp(videoIdStr) {
  const videoId = BigInt(videoIdStr);

  // Extraire les 31 bits de timestamp (en secondes)
  const timestampSeconds = Number(videoId >> 32n);

  // Convertir en millisecondes
  const timestampMillis = timestampSeconds * 1000;

  // Créer un objet Date (locale = France si exécuté en France)
  const localDate = new Date(timestampMillis);

  return localDate;
}

// Exemple d'utilisation
const url =
  "https://www.tiktok.com/@love.comptabilitys/video/7461657215347264800";
const videoId = url.split("/").pop();

const result = decodeTikTokTimestamp(videoId);
console.log(result);
