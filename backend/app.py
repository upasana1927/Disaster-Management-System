import sys
import spacy

from geopy.geocoders import Nominatim
sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, request, jsonify
from flask_cors import CORS

from services.news_fetcher import fetch_live_news

# =====================================================
# IMPORTS
# =====================================================

# ML MODEL 1
from ml_model.predict import predict

# ML MODEL 2
from ml_model_2.predict import predict_disaster

from ml_model_2.priority_engine import (
    calculate_priority,
    get_priority_level
)

from ml_model_2.weather_service import (
    get_weather_severity
)

from ml_model_2.action_engine import (
    get_action
)

# ML MODEL 3
from ml_model_3.predict import predict_disaster as predict_disaster_map
from ml_model_3.locations import extract_locations

# =====================================================
# APP
# =====================================================

app = Flask(__name__)
CORS(app)

# =====================================================
# NLP + GEO
# =====================================================

nlp = spacy.load("en_core_web_sm")

geolocator = Nominatim(
    user_agent="disaster_dashboard"
)

# =====================================================
# LOCATION EXTRACTION + GEO
# =====================================================

def extract_location_and_coords(text):

    try:

        doc = nlp(text)

        locations = []

        # =====================================
        # EXTRACT LOCATION ENTITIES
        # =====================================

        for ent in doc.ents:

            if ent.label_ in ["GPE", "LOC"]:

                locations.append(ent.text)

        # =====================================
        # NO LOCATION FOUND
        # =====================================

        if not locations:

            return {

                "location": "Unknown",

                "lat": 20.5937,

                "lng": 78.9629
            }

        # =====================================
        # FIRST LOCATION
        # =====================================

        location_name = locations[0]

        print("EXTRACTED LOCATION:")
        print(location_name)

        # =====================================
        # GEO CODING
        # =====================================

        geo = geolocator.geocode(location_name)

        # =====================================
        # SUCCESS
        # =====================================

        if geo:

            return {

                "location": location_name,

                "lat": geo.latitude,

                "lng": geo.longitude
            }

        # =====================================
        # GEO FAILED
        # =====================================

        return {

            "location": location_name,

            "lat": 20.5937,

            "lng": 78.9629
        }

    except Exception as e:

        print("LOCATION ERROR:")
        print(str(e))

        return {

            "location": "Unknown",

            "lat": 20.5937,

            "lng": 78.9629
        }
# =====================================================
# ROUTE 1 → HUMAN NEEDS
# =====================================================

@app.route("/predict", methods=["POST"])
def predict_route():

    try:

        data = request.get_json()

        text = data.get("text", "")

        needs = predict(text)

        return jsonify({
            "needs": needs
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =====================================================
# ROUTE 2 → PRIORITY ANALYSIS
# =====================================================

@app.route("/analyze", methods=["POST"])
def analyze():

    try:

        data = request.json

        tweets = data.get("tweets", [])
        city = data.get("city", "")

        if not tweets:

            return jsonify({
                "error": "No tweets provided"
            }), 400

        disaster_count = 0
        predictions = []

        for t in tweets:

            result = predict_disaster(t)

            predictions.append(result)

            if result == "Disaster":
                disaster_count += 1

        total = len(tweets)

        disaster_ratio = disaster_count / total

        weather_severity = get_weather_severity(city)

        score = calculate_priority(
            disaster_count,
            disaster_ratio,
            weather_severity,
            tweets
        )

        priority = get_priority_level(score)

        actions = get_action(priority)

        return jsonify({
            "total": total,
            "disaster_count": disaster_count,
            "ratio": round(disaster_ratio, 2),
            "weather": weather_severity,
            "priority": priority,
            "actions": actions,
            "predictions": predictions
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =====================================================
# ROUTE 3 → LIVE DASHBOARD DATA
# =====================================================

@app.route("/disaster-data", methods=["GET"])
def get_dashboard_data():

    try:

        print("\nDASHBOARD API CALLED\n")

        tweets = fetch_live_news()

        print("LIVE NEWS:")
        print(tweets)

        disaster_data = []

        priority_stats = {
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0
        }

        needs_count = {}

        if not tweets:

            return jsonify({
                "disaster": [],
                "priority": priority_stats,
                "needs": []
            })

        # =====================================================
        # PROCESS EACH NEWS
        # =====================================================

        for tweet in tweets:

            print("\nTWEET:")
            print(tweet)

            # =====================================================
            # DISASTER PREDICTION
            # =====================================================

            disaster_result = predict_disaster(tweet)

            print("DISASTER RESULT:")
            print(disaster_result)

            # =====================================================
            # HUMAN NEEDS
            # =====================================================

            needs = predict(tweet)

            print("NEEDS:")
            print(needs)

            # =====================================================
            # PRIORITY
            # =====================================================

            single_disaster_count = (
                1 if disaster_result == "Disaster"
                else 0
            )

            single_ratio = (
                single_disaster_count / 1
            )

            weather_severity = 2

            score = calculate_priority(
                single_disaster_count,
                single_ratio,
                weather_severity,
                [tweet]
            )

            priority_level = get_priority_level(score)

            print("PRIORITY:")
            print(priority_level)

            # =====================================================
            # PRIORITY COUNT
            # =====================================================

            if priority_level in priority_stats:

                priority_stats[
                    priority_level
                ] += 1

            # =====================================================
            # NEEDS COUNT
            # =====================================================

            if isinstance(needs, list):

                for need in needs:

                    need = str(need)

                    if need in needs_count:

                        needs_count[need] += 1

                    else:

                        needs_count[need] = 1

            elif isinstance(needs, str):

                if needs in needs_count:

                    needs_count[needs] += 1

                else:

                    needs_count[needs] = 1

            # =====================================================
            # LOCATION EXTRACTION
            # =====================================================

            location_data = extract_location_and_coords(
                tweet
            )

            print("LOCATION:")
            print(location_data)

            # =====================================================
            # STORE DATA
            # =====================================================

            disaster_data.append({

                "location":
                    location_data["location"],

                "lat":
                    location_data["lat"],

                "lng":
                    location_data["lng"],

                "disaster":
                    str(disaster_result),

                "priority":
                    priority_level,

                "tweet":
                    str(tweet)
            })

        # =====================================================
        # NEEDS RESPONSE
        # =====================================================

        needs_response = []

        for key, value in needs_count.items():

            needs_response.append({

                "name": key,

                "count": value
            })

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        final_response = {

            "disaster": disaster_data,

            "priority": priority_stats,

            "needs": needs_response
        }

        print("\nFINAL RESPONSE:")
        print(final_response)

        return jsonify(final_response)

    except Exception as e:

        print("\nDASHBOARD ERROR\n")
        print(str(e))

        return jsonify({
            "error": str(e)
        }), 500

# =====================================================
# ROUTE 4 → DATASET BASED MAP ANALYSIS (Model 3)
# =====================================================

@app.route("/analyze-disaster-map", methods=["GET"])
def analyze_disaster_map():

    try:

        from ml_model_3.load_data import load_data

        train_df, dev_df, test_df = load_data()

        df = test_df.sample(100)

        results = []

        for _, row in df.iterrows():

            tweet = row["text"]

            # DISASTER PREDICTION
            disaster = predict_disaster_map(tweet)

            # LOCATION EXTRACTION
            locations = extract_locations(tweet)

            if not locations:

                results.append({
                    "location": "Unknown",
                    "disaster": disaster,
                    "tweet": tweet
                })

            else:

                for loc in locations:

                    results.append({
                        "location": loc,
                        "disaster": disaster,
                        "tweet": tweet
                    })

        # PIE CHART DATA
        disaster_counts = {}

        for item in results:

            d = item["disaster"]

            disaster_counts[d] = (
                disaster_counts.get(d, 0) + 1
            )

        pie_data = [

            {"name": k, "value": v}

            for k, v in disaster_counts.items()
        ]

        # BAR CHART DATA
        location_counts = {}

        for item in results:

            loc = item["location"]

            location_counts[loc] = (
                location_counts.get(loc, 0) + 1
            )

        bar_data = [

            {"location": k, "count": v}

            for k, v in location_counts.items()
        ]

        return jsonify({

            "total": len(df),

            "results": results,

            "pie": pie_data,

            "bar": bar_data
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =====================================================
# ROUTE 5 → MANUAL TWEET ANALYSIS (YOUR MODEL 3)
# =====================================================

# @app.route("/manual-disaster-analysis", methods=["POST"])
# def manual_disaster_analysis():

#     try:

#         data = request.get_json()

#         tweet = data.get("tweet", "")

#         if not tweet:

#             return jsonify({
#                 "error": "Tweet is required"
#             }), 400

#         # DISASTER PREDICTION
#         disaster = predict_disaster_map(tweet)

#         # LOCATION EXTRACTION
#         locations = extract_locations(tweet)

#         if not locations:

#             locations = ["Unknown"]

#         return jsonify({

#             "tweet": tweet,

#             "disaster": disaster,

#             "locations": locations

#         })

#     except Exception as e:

#         return jsonify({
#             "error": str(e)
#         }), 500
# =====================================================
# ROUTE 5 → MANUAL TWEET ANALYSIS
# =====================================================

@app.route("/manual-disaster-analysis", methods=["POST"])
def manual_disaster_analysis():

    try:

        data = request.get_json()

        tweet = data.get("tweet", "")

        # 🔥 Disaster prediction
        disaster = predict_disaster_map(tweet)

        # 🔥 Location extraction
        locations = extract_locations(tweet)

        if not locations:
            locations = ["Unknown"]

        return jsonify({

            "tweet": tweet,

            "disaster": disaster,

            "locations": locations

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":

    app.run(
        port=5001,
        debug=True
    )