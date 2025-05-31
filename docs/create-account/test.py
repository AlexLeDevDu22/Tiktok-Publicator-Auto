from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
import random
import os

def load_proxies(filename="docs/create-account/proxies.txt"):
    if not os.path.exists(filename):
        print("❌ Fichier proxies.txt manquant")
        return []
    with open(filename, "r") as f:
        proxies = [line.strip() for line in f if line.strip()]
    return proxies

def get_proxy_options(proxy_raw):
    chrome_options = Options()
    chrome_options.add_argument("--incognito")
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    # Support user:pass@ip:port format
    if "@" in proxy_raw:
        creds, ip_port = proxy_raw.split("@")
        user, pwd = creds.split(":")
        ip, port = ip_port.split(":")
        plugin_file = create_proxy_auth_plugin(ip, port, user, pwd)
        chrome_options.add_extension(plugin_file)
    else:
        chrome_options.add_argument(f'--proxy-server=http://{proxy_raw}')
    
    return chrome_options

def create_proxy_auth_plugin(ip, port, username, password):
    # Génère un plugin proxy auth pour Chrome (temporaire)
    manifest_json = """
    {
        "version": "1.0.0",
        "manifest_version": 2,
        "name": "Chrome Proxy",
        "permissions": [
            "proxy",
            "tabs",
            "unlimitedStorage",
            "storage",
            "<all_urls>",
            "webRequest",
            "webRequestBlocking"
        ],
        "background": {
            "scripts": ["background.js"]
        },
        "minimum_chrome_version":"22.0.0"
    }
    """
    background_js = f"""
    var config = {{
            mode: "fixed_servers",
            rules: {{
              singleProxy: {{
                scheme: "http",
                host: "{ip}",
                port: parseInt({port})
              }},
              bypassList: ["localhost"]
            }}
          }};
    chrome.proxy.settings.set({{value: config, scope: "regular"}}, function() {{ }});
    chrome.webRequest.onAuthRequired.addListener(
        function(details) {{
            return {{
                authCredentials: {{
                    username: "{username}",
                    password: "{password}"
                }}
            }};
        }},
        {{urls: ["<all_urls>"]}},
        ['blocking']
    );
    """
    plugin_dir = f"./proxy_auth_plugin_{ip}_{port}"
    if not os.path.exists(plugin_dir):
        os.makedirs(plugin_dir)
        with open(os.path.join(plugin_dir, "manifest.json"), 'w') as f:
            f.write(manifest_json)
        with open(os.path.join(plugin_dir, "background.js"), 'w') as f:
            f.write(background_js)
    return plugin_dir

def wait_manual(message):
    input(f"\n⏸️  {message} ➤ Appuie sur Entrée quand c'est fait.")

def start_browser_with_proxy(proxy=None):
    if proxy:
        print(f"🌐 Utilisation du proxy : {proxy}")
        chrome_options = get_proxy_options(proxy)
    else:
        print("🌐 AUCUN proxy utilisé (dev)")
        chrome_options = Options()
        chrome_options.add_argument("--incognito")
        chrome_options.add_argument("--start-maximized")

    driver = webdriver.Chrome(options=chrome_options)
    return driver

def run_session(proxy=None):
    driver = start_browser_with_proxy(proxy)

    try:
        print("\n🚀 Étape 1 : Créer un compte email (GMX ou autre)")
        driver.get("https://www.gmx.com/")
        wait_manual("➡️ Crée le compte email à la main + fais le CAPTCHA")

        print("\n📥 Étape 2 : TikTok - Lancer la création du compte")
        driver.get("https://www.tiktok.com/signup")
        wait_manual("🧾 Crée le compte TikTok avec l’email + reviens ici après validation mail")

        wait_manual("📲 Ajoute un numéro via SMS-activate ou autre, puis valide avec le code")

        print("✅ Compte terminé. Garde bien les identifiants !")

    except Exception as e:
        print(f"❌ Erreur pendant la session : {e}")
    finally:
        driver.quit()

def main():
    proxies = load_proxies()
    use_proxies = len(proxies) > 0

    print(f"\n🧠 {len(proxies)} proxy(s) chargés\n")

    while True:
        proxy = random.choice(proxies) if use_proxies else None
        run_session(proxy)

        again = input("\n🔁 Créer un autre compte ? (y/n) : ")
        if again.lower() != "y":
            break

if __name__ == "__main__":
    main()
