import argparse
import json
import mysql.connector

parser = argparse.ArgumentParser()

parser.add_argument(
    '--json-file',
    dest='json_file',
    action='store',
    help='Fichier JSON contenant les données'
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

with open(args.json_file, 'r', encoding='utf-8') as file:
    datas = json.load(file)


connection = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='repost_data',
    port=3306
)

if connection.is_connected():
    cursor = connection.cursor()

    #! create niche
    sql = "INSERT INTO niches (name, description, example_link) VALUES (%s, %s, %s)"
    values = (args.name, args.description, args.example_link)
    cursor.execute(sql, values)
    connection.commit()

    videos = []
    for data in datas:
        videos.append({
            "niche_id": cursor.lastrowid,
            "link": data[0],
            "initial_description": data[1],})

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
    