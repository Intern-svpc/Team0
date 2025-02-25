from flask import Flask, render_template, jsonify
from pymongo import MongoClient
import random
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Connect to MongoDB (local instance)
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["avatarDialogsDB"]
dialogs_collection = db["dialogs"]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_questions")
def get_questions():
    try:
        # Fetch the introduction dialog (one document with category "introduction")
        introduction = dialogs_collection.find_one({"category": "introduction"}, {"_id": 0})
        if not introduction:
            raise ValueError("No introduction dialog found in the database.")
        
        # Fetch all other dialogs (questions) where category is not "introduction"
        questions_cursor = dialogs_collection.find({"category": {"$ne": "introduction"}}, {"_id": 0})
        questions = list(questions_cursor)
        if not questions:
            app.logger.warning("No question dialogs found in the database.")
        
        random.shuffle(questions)
        if len(questions) > 10:
            questions = questions[:10]
        
        return jsonify({"introduction": introduction, "questions": questions})
    except Exception as e:
        app.logger.error("Error fetching questions: %s", e)
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True)
