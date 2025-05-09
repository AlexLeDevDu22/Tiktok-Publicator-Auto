"""TikTok-Uploader entry point script"""

from tiktok_uploader.upload import upload_videos
from tiktok_uploader.auth import AuthBackend

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

import sys
import json


def main(videos, user_name):
    """
    Entry point for TikTok-Uploader, makes a call to CLI
    """
    # Crée les options headless
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")

    options.add_argument("--user-data-dir=data/chrome-profiles/"+user_name)
    options.add_argument("--profile-directory="+user_name)

    # Lance Chrome
    driver = webdriver.Chrome(options=options)

    sessionid = get_session_id(driver, user_name)
    
    auth=AuthBackend(sessionid=sessionid)

    upload_videos(videos, browser_agent=driver, auth=auth)

def get_session_id(driver, user_name) -> str:
    driver.get("https://www.tiktok.com")
    #time.sleep(0.4)
    
    cookies = driver.get_cookies()

    # Recherche du cookie sessionid
    for cookie in cookies:
        if cookie['domain'] == '.tiktok.com' and cookie['name'] == 'sessionid':
            with open("data/accounts.json", "w") as f:
                accounts = json.load(f)
                accounts[user_name]["session_id"] = cookie['value']
                json.dump(accounts, f, indent=4)
            return cookie['value']
    return ""

if __name__ == "__main__":
    main([json.loads(sys.argv[1])], sys.argv[2])