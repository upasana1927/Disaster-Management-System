import requests

print("NEWS SERVICE FILE LOADED")

API_KEY = "2d04ecb3a2c44280832f5fce6ab3da47"


def fetch_live_news():

    print("FETCH FUNCTION CALLED")

    url = (
        f"https://newsapi.org/v2/everything?"
        f"q=disaster OR flood OR earthquake OR fire"
        f"&language=en"
        f"&sortBy=publishedAt"
        f"&apiKey={API_KEY}"
    )

    print("REQUEST URL:")
    print(url)

    response = requests.get(url)

    print("STATUS CODE:")
    print(response.status_code)

    data = response.json()

    print("FULL API RESPONSE:")
    print(data)

    articles = []

    if "articles" in data:

        for article in data["articles"]:

            title = article.get("title", "")

            if title:
                articles.append(title)

    print("ARTICLES:")
    print(articles)

    return articles