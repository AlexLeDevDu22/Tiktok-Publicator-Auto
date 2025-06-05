

from selenium import webdriver
import json,os
from bs4 import BeautifulSoup
#https://www.tiktok.com/@pickyourinitials/video/7335508841376894250

ACCOUNT="timeportals"

start_index=0

driver = webdriver.Chrome()
driver.get("https://www.tiktok.com/@"+ACCOUNT)

# automate scroll down 
import time, threading

scroll_down_val = True
def scroll_down():
    global scroll_down_val
    while scroll_down_val:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)

scroll_thread = threading.Thread(target=scroll_down)
scroll_thread.start()
input("waiting..")
scroll_down_val = False
scroll_thread.join()

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
        # Trouver le premier lien ('a') et obtenir son attribut 'href'
        link = element.get('href')
        alt = element.find("picture").find("img").get('alt').split(" créé par ")[0]
        # Ajouter href et alt à la liste des résultats
        result_list.append([link, alt])
    except: pass

# Inverser la liste
result_list.reverse()
print(result_list)

def fusionner_listes(liste1, liste2, start_index):
    
    fusion = liste1[:start_index]
    liste1=liste1[start_index:]
    
    taille_min = min(len(liste1), len(liste2))
    # Parcourir jusqu'à la taille de la plus petite liste
    for i in range(taille_min):
        fusion.append(liste2[i])
        fusion.append(liste1[i])
    
    # Ajouter les éléments restants de la liste la plus longue
    if len(liste1) > len(liste2):
        fusion.extend(liste1[taille_min:])
    elif len(liste2) > len(liste1):
        fusion.extend(liste2[taille_min:])
    
    return fusion

if os.path.exists("tiktoks.json"):
    with open(r"tiktoks.json", encoding="utf-8") as file:
        list1 = json.load(file)
else:
    list1 = []

list1=fusionner_listes(list1, result_list, start_index)

with open(r"tiktoks.json", "w", encoding="utf-8") as file:
    # Utilisez json.dump() pour enregistrer les données dans le fichier
    json.dump(list1,file , ensure_ascii=False, indent=4)