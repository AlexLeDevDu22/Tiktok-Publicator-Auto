import argparse
from selenium import webdriver
import filter_only_1min
from bs4 import BeautifulSoup
import mysql.connector
from mysql.connector import Error

def get_datas(account_pseudo):

    driver = webdriver.Chrome()
    driver.get("https://www.tiktok.com/@"+account_pseudo)

    input("Appuyez sur Entrée après avoir ouvert la page TikTok dans le navigateur et avoir charger toutes les videos du profil.")

    html = driver.page_source
    driver.quit()
    soup = BeautifulSoup(html, 'html.parser')

    # Créer une liste pour stocker les résultats
    result_list = []
    # Trouver tous les éléments avec la classe 'css-1as5cen-DivWrapper e1cg0wnj1'
    elements = soup.find_all(class_='css-1mdo0pl-AVideoContainer e19c29qe4')

    print(elements)
    # Parcourir chaque élément
    for element in elements:
        try:
            if element is not None:
                # Trouver le premier lien ('a') et obtenir son attribut 'href'
                link = element.get('href')
                alt = element.find("picture").find("img").get('alt').split(" créé par ")[0]
                # Ajouter href et alt à la liste des résultats
                result_list.append({"link":link, "initial_description":alt})
        except: pass

    # Inverser la liste
    result_list.reverse()

    return result_list



if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    # Argument positionnel obligatoire : liste de chaînes
    parser.add_argument(
        'accounts',
        nargs='+',
        help='Liste des comptes TikTok pour la niche'
    )

    # Argument optionnel booléen
    parser.add_argument(
        '--more-1-min',
        dest='more_1_min',
        action=argparse.BooleanOptionalAction,
        default=True,
        help='Ne prend seulement les vidéos de plus d\'une minute'
    )

    parser.add_argument(
        '--name',
        dest='name',
        action='store',
        default="tiktok",
        help='Nom de la niche'
    )
    parser.add_argument(
        '--description',
        dest='description',
        action='store',
        default="tiktok",
        help='Description de la niche'
    )

    parser.add_argument(
        '--example-link',
        dest='example_link',
        action='store',
        default="https://www.tiktok.com/@example",
        help='Exemple de lien TikTok'
    )

    args = parser.parse_args()

    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='repost_data',
        port=3306
    )
    if connection.is_connected():
        cursor = connection.cursor()

        #! getting videos
        videos = []
        for account in args.accounts:
            new_videos=get_datas(account)
            if args.more_1_min:
                new_videos=filter_only_1min.filter_only_1min(new_videos)
            videos.extend(new_videos or [])

        assert len(videos) > 0, "Aucune vidéo trouvée"

        #! create niche
        sql = "INSERT INTO niches (name, description, example_link) VALUES (%s, %s, %s)"
        values = (args.name, args.description, args.example_link)
        cursor.execute(sql, values)
        connection.commit()

        for i in range(len(videos)):
            videos[i]["niche_id"] = cursor.lastrowid
        #! save videos in db
        # Générer les noms de colonnes et placeholders
        columns = videos[0].keys()
        columns_str = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        sql = f"INSERT INTO stored_tiktoks ({columns_str}) VALUES ({placeholders})"

        # Extraire les valeurs des dictionnaires dans le bon ordre
        values = [tuple(row[col] for col in columns) for row in videos]

        # Insérer toutes les lignes
        cursor.executemany(sql, values)

        # Valider et fermer
        connection.commit()
        cursor.close()
        connection.close()
    else:
        raise Exception("Erreur lors de la connexion à la base de données")
        