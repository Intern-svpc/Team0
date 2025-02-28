from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
import random
import logging
import datetime

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Connect to MongoDB (local instance)
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["avatarDialogsDB"]

# Collection for interview dialogs (introduction and questions)
dialogs_collection = db["dialogs"]

# Collection for transcripts. A TTL index will automatically delete documents after 24 hours.
transcripts_collection = db["transcripts"]
# Create TTL index on the 'createdAt' field (24 hours = 86400 seconds)
transcripts_collection.create_index("createdAt", expireAfterSeconds=86400)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_questions")
def get_questions():
    try:
        # Fetch the introduction dialog (must have category "introduction")
        introduction = dialogs_collection.find_one({"category": "introduction"}, {"_id": 0})
        if not introduction:
            raise ValueError("No introduction dialog found in the database.")
        
        # Fetch other dialogs (questions) where category is not "introduction"
        questions_cursor = dialogs_collection.find({"category": {"$ne": "introduction"}}, {"_id": 0})
        questions = list(questions_cursor)
        if not questions:
            logging.warning("No question dialogs found in the database.")
        
        random.shuffle(questions)
        # Limit to maximum of 10 questions if more exist.
        if len(questions) > 10:
            questions = questions[:10]
        
        return jsonify({"introduction": introduction, "questions": questions})
    except Exception as e:
        logging.error("Error fetching questions: %s", e)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/save_transcript", methods=["POST"])
def save_transcript():
    try:
        data = request.get_json()
        transcript_text = data.get("transcript", "").strip()
        if not transcript_text:
            return jsonify({"error": "No transcript provided"}), 400
        
        transcript_doc = {
            "transcript": transcript_text,
            "createdAt": datetime.datetime.utcnow()
        }
        transcripts_collection.insert_one(transcript_doc)
        return jsonify({"message": "Transcript saved"}), 200
    except Exception as e:
        logging.error("Error saving transcript: %s", e)
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True)
