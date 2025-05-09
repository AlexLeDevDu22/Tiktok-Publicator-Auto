import requests
import pandas as pd
from datetime import datetime

# Remplace par tes propres clés API
ACCESS_TOKEN = "act.Nzb2Z1YDdxsYk7PQ40FKXrOls9uptrfws4zB4rSvf7LEQCaHaikzTbdXdBAe!4952.e1"
BASE_URL = "https://open.tiktokapis.com/v2"  # URL de l'API TikTok

def get_user_info():
    """Récupère les informations générales sur l'utilisateur."""
    url = f"{BASE_URL}/user/info/"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    params = {
        "fields": "open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,username,follower_count,following_count,likes_count,video_count"  # Paramètres spécifiques
    }
    response = requests.get(url, headers=headers, params=params)
    print(response.json())
    
    if response.status_code == 200:
        data = response.json()
        return data['data']['user']
    else:
        print(f"Erreur {response.status_code}: {response.json()}")
        return {}

def get_video_list():
    """Récupère la liste des vidéos publiées par l'utilisateur."""
    url = f"{BASE_URL}/video/list/"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    params = { "fields": "id, create_time, cover_image_url, share_url, video_description, duration, height, width, title, embed_html, embed_link, like_count, comment_count, share_count, view_count"}
    response = requests.post(url, headers=headers, params=params, data={"max_count": 20})
    
    if response.status_code == 200:
        videos=response.json()["data"]["videos"]

        return videos
    else:
        print(f"Erreur {response.status_code}: {response.json()}")
        return []

def calculate_statistics(videos):
    """Calcule des statistiques avancées basées sur les vidéos."""
    if not videos:
        return {}

    total_views = sum(video['view_count'] for video in videos)
    total_likes = sum(video['like_count'] for video in videos)
    total_comments = sum(video['comment_count'] for video in videos)
    total_shares = sum(video['share_count'] for video in videos)

    # average_completion_rate = sum(
    #     video['statistics']['average_watch_time'] / video['statistics']['duration']
    #     for video in videos if 'average_watch_time' in video['statistics']
    # ) / len(videos)
    average_completion_rate=None

    return {
        "total_views": total_views,
        "total_likes": total_likes,
        "total_comments": total_comments,
        "total_shares": total_shares,
        "total_engagement_rate": (total_likes + total_comments + total_shares) / total_views,
        "average_completion_rate": average_completion_rate,
    }

def display_dashboard(user_info, video_stats, stats):
    """Affiche les informations sous forme de tableau."""
    print("\n=== Informations utilisateur ===")
    for key, value in user_info.items():
        print(f"{key.capitalize().replace('_', ' ')}: {value}")

    print("\n=== Statistiques globales ===")
    for key, value in stats.items():
        print(f"{key.capitalize().replace('_', ' ')}: {value:.2f}" if isinstance(value, float) else f"{key.capitalize().replace('_', ' ')}: {value}")

    print("\n=== Vidéos récentes ===")
    video_df = pd.DataFrame(video_stats)
    print(video_df.__dict__)

    if not video_df.empty:
        print(video_df[['id', 'title', 'views', 'likes', 'comments', 'shares', "duration","engagement rate"]])
    else:
        print("Aucune vidéo disponible.")

def main():
    print("=== Récupération des données TikTok ===")
    user_info = get_user_info()
    videos = get_video_list()
    
    video_stats = [
        {
            "id": video['id'],
            "title": video["title"],
            "views": video['view_count'],
            "likes": video['like_count'],
            "comments": video['comment_count'],
            "shares": video['share_count'],
            "duration": video['duration'],
            "engagement rate": round((video["like_count"]*2 + video["comment_count"] + video["share_count"])/(0.5*(video["view_count"]))*(video["duration"]/10),2)
        }
        for video in videos
    ]

    stats = calculate_statistics(videos)

    # Affichage du tableau de bord
    display_dashboard(user_info, video_stats, stats)

if __name__ == "__main__":
    main()

