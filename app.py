import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

from optimizer import optimize_timetable

load_dotenv()

app = Flask(__name__)

CORS(app)

# MongoDB is optional for initial local testing.
mongo_uri = os.getenv("MONGO_URI")
mongo_client = None
schedules_collection = None

if mongo_uri:
    try:
        mongo_client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=3000
        )

        mongo_client.admin.command("ping")

        db = mongo_client["smartschedule"]
        schedules_collection = db["schedules"]

        print("MongoDB connected successfully.")

    except Exception as error:
        print("MongoDB unavailable:", error)
        mongo_client = None
        schedules_collection = None


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "SmartSchedule AI Python backend is running."
    })


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A JSON request body is required."
        }), 400

    result = optimize_timetable(data)

    return jsonify(result), 200 if result["success"] else 409


@app.route("/api/optimize", methods=["POST"])
def optimize():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A JSON request body is required."
        }), 400

    # Existing timetable is optional.
    # The optimizer attempts to preserve valid assignments.
    data.setdefault("existing_timetable", [])

    result = optimize_timetable(data)

    return jsonify(result), 200 if result["success"] else 409


@app.route("/api/schedules", methods=["POST"])
def save_schedule():
    if schedules_collection is None:
        return jsonify({
            "success": False,
            "message": (
                "Database unavailable. Configure MONGO_URI "
                "to enable schedule storage."
            )
        }), 503

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A JSON request body is required."
        }), 400

    timetable = data.get("timetable")

    if not isinstance(timetable, list) or not timetable:
        return jsonify({
            "success": False,
            "message": "A non-empty timetable is required."
        }), 400

    document = {
        "title": str(data.get("title", "Untitled Schedule")),
        "timetable": timetable,
        "created_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        )
    }

    result = schedules_collection.insert_one(document)

    return jsonify({
        "success": True,
        "message": "Schedule saved successfully.",
        "id": str(result.inserted_id)
    }), 201


@app.route("/api/schedules", methods=["GET"])
def get_schedules():
    if schedules_collection is None:
        return jsonify({
            "success": False,
            "message": "Configure MongoDB to retrieve saved schedules."
        }), 503

    schedules = []

    for document in schedules_collection.find().sort(
        "created_at", -1
    ):
        document["_id"] = str(document["_id"])
        document["created_at"] = document["created_at"].isoformat()
        schedules.append(document)

    return jsonify({
        "success": True,
        "schedules": schedules
    })


@app.route("/api/schedules/<schedule_id>", methods=["DELETE"])
def delete_schedule(schedule_id):
    if schedules_collection is None:
        return jsonify({
            "success": False,
            "message": "Configure MongoDB to delete saved schedules."
        }), 503

    if not ObjectId.is_valid(schedule_id):
        return jsonify({
            "success": False,
            "message": "Invalid schedule ID."
        }), 400

    result = schedules_collection.delete_one({
        "_id": ObjectId(schedule_id)
    })

    if result.deleted_count == 0:
        return jsonify({
            "success": False,
            "message": "Schedule not found."
        }), 404

    return jsonify({
        "success": True,
        "message": "Schedule deleted successfully."
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", 5000)),
        debug=False
    )