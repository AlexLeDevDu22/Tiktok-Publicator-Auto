from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import sys
import mysql.connector
from mysql.connector import Error

profile = sys.argv[1]

print(f"Profile: {profile}")

# Lancement de Chrome avec ton profil (optionnel mais recommandé si authentifié)
chrome_options = Options()
#chrome_options.add_argument("--user-data-dir=/home/alex/.config/google-chrome")
chrome_options.add_argument(f"--user-data-dir=data/chrome-profiles/{profile}")
chrome_options.add_argument(f"--profile-directory={profile}")

driver = webdriver.Chrome(options=chrome_options)

# Aller sur TikTok (attends un peu que la page charge)
driver.get("https://www.tiktok.com/@")
input("Connect yourself to TikTok and press Enter...")

# Connexion à la base de données
try:
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='repost_data',
        port=3306
    )
    if connection.is_connected():
        cursor = connection.cursor()

        pseudo=input("Set the profile pseudo: ")
        social_media="tiktok" #input("Set the social network (tiktok, instagram, youtube, snapchat): ")
        mail=input("Set the mail: ")
        owner=input("Who owns this account? (Alex / Maxence) ")
        assert owner in ["Alex", "Maxence"], "Owner not found."

        cursor.execute("SELECT * FROM niches")
        niches = cursor.fetchall()  # <- récupère les lignes comme une liste de tuples
        # Affiche les IDs et noms disponibles
        
        print("Voici les niches disponibles. Entrez l'**ID** correspondant :\n")
        print("-" * 50)
        for niche in niches:
            print(f"ID: {niche[0]:<3} | Nom: {niche[1]} ({niche[2]})")
        print("-" * 50)
        # Demander à l'utilisateur l'ID choisi
        niche_belonged = input("Set the niche ID belonged: ")
        assert niche_belonged in [str(niche[0]) for niche in niches], "Niche ID not found."

        sessionid=input("Please inspect the page -> Applications -> Cookies -> tiktok.com and enter the sessionid cookie value: ")
        assert sessionid != "", "Session ID cannot be empty."

        # save account
        sql = "INSERT INTO accounts (social_media, owner, pseudo, mail, sessionid, niche_belonged) VALUES (%s, %s, %s, %s, %s, %s)"
        values = (social_media, owner, pseudo, mail, sessionid, niche_belonged)

        cursor.execute(sql, values)
        connection.commit()

        print("Account save with success.")

except Error as e:
    print("Erreur lors de la connexion ou de l'exécution :", e)

finally:
    if connection.is_connected():
        cursor.close()
        connection.close()



driver.quit()