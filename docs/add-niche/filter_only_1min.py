import requests
import re
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# Fonction pour traiter une URL et vérifier sa durée
def process_url(data):
    # struct de videos: [{"link": "https://www.tiktok.com/@...", ...}, ...]
    try:
        # Récupérer le contenu de l'URL
        response = requests.get(data["link"], timeout=10)  # Timeout pour éviter les blocages
        response.raise_for_status()  # Vérifie si la requête est réussie
        content = response.text

        # Rechercher la ligne contenant "duration" et extraire la valeur
        for line in content.splitlines():
            if '"duration":' in line:
                match = re.search(r'"duration":\s*(\d+)', line)
                if match and int(match.group(1)) >= 60:
                    return data  # Renvoie l'URL si la durée est >= 60
                break
    except Exception as e:
        print(f"Error processing URL: {data['link']}, Error: {e}")
    return None  # Si aucune durée n'est trouvée ou en cas d'erreur

def filter_only_1min(videos) -> list:

    print("Total URLs:", len(videos))

    # Liste pour stocker les valeurs filtrées
    filtered_urls = []

    # Nombre de threads simultanés (ajuster selon votre machine)
    MAX_WORKERS = 20

    # Utilisation de ThreadPoolExecutor avec barre de progression
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Initialiser la barre de progression
        with tqdm(total=len(videos), desc="Processing URLs") as pbar:
            # Soumettre toutes les tâches en parallèle
            future_to_url = {
                executor.submit(process_url, x): x for x in videos
            }

            # Collecter les résultats au fur et à mesure
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    result = future.result()
                    if result is not None:  # Si une URL valide est trouvée
                        filtered_urls.append(result)
                except Exception as e:
                    print(f"Error handling future for URL {url}: {e}")
                finally:
                    pbar.update(1)  # Mise à jour de la barre de progression
    print("Valid durations:", len(filtered_urls))
    
    return filtered_urls 
