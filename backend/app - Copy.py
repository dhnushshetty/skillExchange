# =================== [app.py] - Flask Backend ===================

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="toor",
        database="skill_exchange"
    )

@app.route("/register", methods=["POST"])
def register():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    try:
        hashed_pw = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        cursor.execute("""
            INSERT INTO User (Name, Email, Phone, Location, Bio, Password, DateJoining)
            VALUES (%s, %s, %s, %s, %s, %s, CURDATE())
        """, (data['name'], data['email'], data['phone'], data['location'], data['bio'], hashed_pw.decode('utf-8')))
        conn.commit()
        return jsonify({"success": True, "message": "User registered successfully."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        cursor.close()
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    cursor.execute("SELECT * FROM User WHERE Email = %s", (data.get("email"),))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user and bcrypt.checkpw(data.get("password").encode('utf-8'), user['Password'].encode('utf-8')):
        return jsonify({"success": True, "userId": user['UserId']})
    return jsonify({"success": False, "message": "Invalid email or password"}), 401

@app.route("/user/<int:user_id>", methods=["GET", "PUT"])
def user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == "GET":
        cursor.execute("SELECT * FROM User WHERE UserId = %s", (user_id,))
        result = cursor.fetchone()
        if result:
            result = {k.lower(): v for k, v in result.items()}
        cursor.close()
        conn.close()
        return jsonify(result)
    elif request.method == "PUT":
        data = request.get_json()
        cursor.execute("""
            UPDATE User SET Name=%s, Phone=%s, Location=%s, Bio=%s
            WHERE UserId = %s
        """, (data['name'], data['phone'], data['location'], data['bio'], user_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})

@app.route("/create-skill", methods=["POST"])
def create_skill():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    cursor.execute("""
        INSERT INTO Skill (SkillName, Description, Category, UserId)
        VALUES (%s, %s, %s, %s)
    """, (data['skillName'], data['description'], data['category'], data['userId']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True}), 201

@app.route("/skills", methods=["GET"])
def get_skills():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    user_id = request.args.get("userId")
    if user_id:
        cursor.execute("""
            SELECT s.SkillId, s.SkillName, s.Description, s.Category, s.UserId, u.Name AS userName
            FROM Skill s JOIN User u ON s.UserId = u.UserId
            WHERE s.UserId = %s
        """, (int(user_id),))
    else:
        cursor.execute("""
            SELECT s.SkillId, s.SkillName, s.Description, s.Category, s.UserId, u.Name AS userName
            FROM Skill s JOIN User u ON s.UserId = u.UserId
        """)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(results)

@app.route("/create-request", methods=["POST"])
def create_request():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    cursor.execute("""
        INSERT INTO Request (UserId, SkillId, Status)
        VALUES (%s, %s, 'Pending')
    """, (data['userId'], data['skillId']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route("/requests", methods=["GET"])
def get_user_requests():
    user_id = request.args.get("userId")
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.RequestId, r.UserId, s.SkillName, r.Status, r.TimeStamp, u.Name AS userName
        FROM Request r
        JOIN Skill s ON r.SkillId = s.SkillId
        JOIN User u ON s.UserId = u.UserId
        WHERE r.UserId = %s
    """, (int(user_id),))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)

@app.route("/received-requests", methods=["GET"])
def get_received_requests():
    user_id = request.args.get("userId")
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.RequestId, r.UserId, u.Name as userName, s.SkillName, r.Status, r.TimeStamp
        FROM Request r
        JOIN Skill s ON r.SkillId = s.SkillId
        JOIN User u ON r.UserId = u.UserId
        WHERE s.UserId = %s
    """, (int(user_id),))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)

@app.route("/transactions/<int:user_id>", methods=["GET"])
def get_transactions(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.TransactionId, r.RequestId, s.SkillName, t.CompletionDate, t.Status, rv.Rating, rv.Comments
        FROM Transaction t
        JOIN Request r ON t.RequestId = r.RequestId
        JOIN Skill s ON r.SkillId = s.SkillId
        LEFT JOIN Review rv ON t.TransactionId = rv.TransactionId
        WHERE r.UserId = %s
    """, (user_id,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(results)

@app.route("/submit-review", methods=["POST"])
def submit_review():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    cursor.execute("""
        INSERT INTO Review (TransactionId, Rating, Comments)
        VALUES (%s, %s, %s)
    """, (data['transaction_id'], data['rating'], data['comments']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

@app.route("/")
def index():
    return "\u2705 Flask API is up."

if __name__ == '__main__':
    print("Flask server starting on http://127.0.0.1:5000")
    app.run(debug=True)