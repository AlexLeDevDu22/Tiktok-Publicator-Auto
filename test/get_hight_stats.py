import requests

url = r"https://www.tiktok.com/aweme/v2/data/insight/?locale=fr&aid=1988&priority_region=FR&region=FR&tz_name=Europe%2FParis&app_name=tiktok_creator_center&app_language=fr&device_platform=web_pc&channel=tiktok_web&device_id=7426847222225356321&os=win&screen_width=1536&screen_height=864&browser_language=fr&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+(Windows)&tz_offset=3600&type_requests=[%7B%22insigh_type%22:%22vv_history%22,%22days%22:732,%22end_days%22:1%7D,%7B%22insigh_type%22:%22pv_history%22,%22days%22:732,%22end_days%22:1%7D,%7B%22insigh_type%22:%22like_history%22,%22days%22:732,%22end_days%22:1%7D,%7B%22insigh_type%22:%22comment_history%22,%22days%22:732,%22end_days%22:1%7D,%7B%22insigh_type%22:%22share_history%22,%22days%22:732,%22end_days%22:1%7D,%7B%22insigh_type%22:%22follower_num_history%22,%22days%22:732,%22end_days%22:1%7D,%7B%22insigh_type%22:%22reached_audience_history%22,%22days%22:732,%22end_days%22:1%7D]"

""""""


headers = {
    "User-Agent": "Mozilla/5.0",  # Simule un vrai navigateur
}
response = requests.get(url, headers=headers)
data = response.json()
print(data)
