import argparse
import json
import pymysql
import pyperclip

parser = argparse.ArgumentParser()

parser.add_argument(
    '--json-file',
    dest='json_file',
    action='store',
    help='Fichier JSON contenant les données'
)
    
parser.add_argument(
    '--niche-id',
    dest='niche_id',
    action='store',
    help='Fichier JSON contenant les données'
)
    
args = parser.parse_args()

with open(args.json_file, 'r', encoding='utf-8') as file:
    datas = json.load(file)

conn = pymysql.connect(
    host='raspberrypi.local',
    user='root',
    password='',
    database='repost_data',
    charset='utf8mb4'  # Assurez-vous que utf8mb4 est bien défini ici
)

cursor = conn.cursor()

videos = []
for data in datas:
    print(data)
    videos.append({
        "niche_id": args.niche_id,
        "link": data[0],
        "initial_description": data[1],})

#! save videos in db
# Générer les noms de colonnes et placeholders
print(videos)
columns = videos[0].keys()
columns_str = ", ".join(columns)
placeholders = ", ".join(["%s"] * len(columns))
sql = f"INSERT INTO stored_tiktoks ({columns_str}) VALUES ({placeholders})"

# Extraire les valeurs des dictionnaires dans le bon ordre
values = [tuple(row[col] for col in columns) for row in videos]

# Créer la requête SQL complète avec les valeurs
full_query = ""
for i, value in enumerate(values):
    full_query += f"INSERT INTO stored_tiktoks ({columns_str}) VALUES ("
    for j, val in enumerate(value):
        if isinstance(val, str):
            full_query += f"'{conn.escape_string(val)}'"
        else:
            full_query += f"{val}"
        if j < len(value) - 1:
            full_query += ", "
    full_query += ");\n"

# Copier la requête SQL complète dans le presse-papier
pyperclip.copy(full_query)

print("Requête SQL complète copiée dans le presse-papier :")
print(pyperclip.paste())

try:
    cursor.executemany(sql, values)
except pymysql.Error as e:
    print(f"Erreur SQL : {e}")

# Valider et fermer
cursor.close()