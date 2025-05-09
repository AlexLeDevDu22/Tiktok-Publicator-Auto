import requests

url = 'https://open.tiktokapis.com/v2/oauth/token/'
headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache'
}
data = {
    'client_key': 'sbaw9bvwbxzgwqvr9y',
    'client_secret': 'Gjud3lzNQXKWnw1PjqXaTfMvWcvBcR5F',
    'code': 'Ai3kS0vR_zEwGLItS9jx3NLTHZXwpW1BNlW78nh2VZMtTp0QyrtvoJVGYrN65A8FG2yGLUUWD9AWZ6tIK6FlPjahd3sXed-sLV_iZKKqcQM5XfeSWiXrtfm2Om-oek2JarMlUm4Bsoe8JrC_NtBFFwOux7vLKYTLVyr_LKxvzoAyfNxFMk0J5CPsaTf9F0HdY3Xt4v_hoo7EiDa3zGjwayJSYA5AiqHhLp9S09T2rBo*3!4901.e1',
    'grant_type': 'authorization_code',
    'redirect_uri': 'https://example.com'
}

response = requests.post(url, headers=headers, data=data)

print(response.status_code)
print(response.json())  # Affiche le résultat en format JSON