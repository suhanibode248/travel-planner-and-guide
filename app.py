from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load datasets
cities = json.load(open("data/cities.json"))
hotels = json.load(open("data/hotels.json"))
restaurants = json.load(open("data/restaurants.json"))
transport = json.load(open("data/transport.json"))
places = json.load(open("data/places.json"))


# ✅ SMART PLAN GENERATOR (UI FRIENDLY FORMAT)
def generate_plan(city_places, days, trip_type, city_name, start_day):

    lines = []

    total_places = len(city_places)

    if total_places == 0:
        fallback_activities = [
            "Shopping",
            "Leisure & Relaxation",
            "Local exploration",
            "Cafe hopping",
            "Street food experience"
        ]

        for d in range(days):
            activity = fallback_activities[d % len(fallback_activities)]

            if trip_type == "Friends":
                text = f"Enjoy {activity} with friends"
            elif trip_type == "Family":
                text = f"Spend time on {activity} with family"
            elif trip_type == "Honeymoon":
                text = f"Romantic {activity}"
            else:
                text = f"{activity} and relaxation"

            lines.append(f"Day {start_day + d}: {text}")

        return "\n".join(lines)

    per_day = max(1, total_places // days)
    index = 0

    trip_prefix = {
        "Solo": "Explore",
        "Family": "Visit family-friendly spots",
        "Friends": "Enjoy with friends at",
        "Honeymoon": "Romantic visit to"
    }

    prefix = trip_prefix.get(trip_type, "Visit")

    fallback_activities = [
        "Shopping",
        "Leisure & Relaxation",
        "Local exploration",
        "Cafe hopping",
        "Street food experience"
    ]

    for day in range(days):
        day_places = city_places[index:index + per_day]
        index += per_day

        if day_places:
            place_names = [p["name"] for p in day_places]
            text = f"{prefix} {', '.join(place_names)}"
        else:
            activity = fallback_activities[day % len(fallback_activities)]

            if trip_type == "Friends":
                text = f"Enjoy {activity} with friends"
            elif trip_type == "Family":
                text = f"Spend time on {activity} with family"
            elif trip_type == "Honeymoon":
                text = f"Romantic {activity}"
            else:
                text = f"{activity} and relaxation"

        lines.append(f"Day {start_day + day}: {text}")

    return "\n".join(lines)


# ✅ HOTEL FILTER
def filter_hotels(city, budget):
    city_hotels = hotels.get(city, [])
    if int(budget) < 5000:
        return [h for h in city_hotels if h.get("type") == "budget"]
    return city_hotels


# ✅ ROUTES
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.json

    city_list = [c.strip() for c in data["destination"].split(",")]
    total_days = int(data["days"])
    budget = data["budget"]
    trip_type = data["trip_type"]

    result = []

    # ✅ SINGLE CITY
    if len(city_list) == 1:
        city = city_list[0]
        city_places = places.get(city, [])

        result.append({
            "city": city,
            "plan": generate_plan(city_places, total_days, trip_type, city, 1),
            "places": city_places,
            "hotels": filter_hotels(city, budget),
            "food": restaurants.get(city, {}),
            "transport": transport.get(city, {})
        })

    # ✅ MULTI CITY
    else:
        num_cities = len(city_list)
        days_per_city = total_days // num_cities
        extra_days = total_days % num_cities

        current_day = 1

        for i, city in enumerate(city_list):
            city_places = places.get(city, [])

            city_days = days_per_city + (1 if i < extra_days else 0)

            result.append({
                "city": city,
                "plan": generate_plan(
                    city_places,
                    city_days,
                    trip_type,
                    city,
                    current_day
                ),
                "places": city_places,
                "hotels": filter_hotels(city, budget),
                "food": restaurants.get(city, {}),
                "transport": transport.get(city, {})
            })

            current_day += city_days

    return jsonify(result)


# ✅ ENTRY POINT
if __name__ == "__main__":
    print("🚀 Flask server starting...")
    app.run(debug=True)