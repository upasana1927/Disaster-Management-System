import sys

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

        # ====================================
        # FETCH LIVE NEWS
        # ====================================

        tweets = fetch_live_news()

        print("LIVE NEWS:")
        print(tweets)

        # ====================================
        # DEFAULT STRUCTURES
        # ====================================

        disaster_data = []

        priority_stats = {
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0
        }

        needs_count = {}

        # ====================================
        # IF EMPTY
        # ====================================

        if not tweets:

            return jsonify({
                "disaster": [],
                "priority": priority_stats,
                "needs": []
            })

        # ====================================
        # PROCESS EACH NEWS
        # ====================================

        for tweet in tweets:

            print("\nTWEET:")
            print(tweet)

            # ====================================
            # DISASTER PREDICTION
            # ====================================

            disaster_result = predict_disaster(tweet)

            print("DISASTER RESULT:")
            print(disaster_result)

            # ====================================
            # HUMAN NEEDS
            # ====================================

            needs = predict(tweet)

            print("NEEDS:")
            print(needs)

            # ====================================
            # PRIORITY CALCULATION
            # ====================================

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

            # ====================================
            # COUNT PRIORITIES
            # ====================================

            if priority_level in priority_stats:

                priority_stats[
                    priority_level
                ] += 1

            # ====================================
            # COUNT NEEDS
            # ====================================

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

            # ====================================
            # STORE DATA
            # ====================================

            disaster_data.append({

                "location": "Live News",

                "disaster": str(disaster_result),

                "priority": priority_level,

                "tweet": str(tweet)
            })

        # ====================================
        # CONVERT NEEDS FORMAT
        # ====================================

        needs_response = []

        for key, value in needs_count.items():

            needs_response.append({

                "name": key,

                "count": value
            })

        # ====================================
        # FINAL RESPONSE
        # ====================================

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
# ROUTE 4 → DISASTER MAP ANALYSIS (ML MODEL 3)
# =====================================================
# =====================================================
# ROUTE 4 → DATASET BASED MAP ANALYSIS (Model 3)
# =====================================================
@app.route("/analyze-disaster-map", methods=["GET"])
def analyze_disaster_map():

    try:
        # ✅ LOAD DATASET
        from ml_model_3.load_data import load_data

        train_df, dev_df, test_df = load_data()

        # 👉 sirf test data use karna hai
        df = test_df.sample(100)
        results = []

        # =========================
        # PROCESS EACH TWEET
        # =========================
        for _, row in df.iterrows():

            tweet = row["text"]

            # 🔥 DISASTER PREDICTION
            disaster = predict_disaster_map(tweet)

            # 🔥 LOCATION EXTRACTION
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

        # =========================
        # PIE DATA
        # =========================
        disaster_counts = {}
        for item in results:
            d = item["disaster"]
            disaster_counts[d] = disaster_counts.get(d, 0) + 1

        pie_data = [
            {"name": k, "value": v}
            for k, v in disaster_counts.items()
        ]

        # =========================
        # BAR DATA
        # =========================
        location_counts = {}
        for item in results:
            loc = item["location"]
            location_counts[loc] = location_counts.get(loc, 0) + 1

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
        return jsonify({"error": str(e)}), 500

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":
    app.run(port=5001, debug=True)