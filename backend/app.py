from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

def get_db_connection():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="toor",
            database="skill_exchange"
        )
    except mysql.connector.Error as e:
        print(f"Database connection error: {e}")
        return None

@app.route("/register", methods=["POST"])
def register():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
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
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
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
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    
    if request.method == "GET":
        try:
            cursor.execute("SELECT UserId, Name, Email, Phone, Location, Bio, DateJoining FROM User WHERE UserId = %s", (user_id,))
            result = cursor.fetchone()
            if result:
                result = {k.lower(): v for k, v in result.items()}  # Convert to camelCase
            cursor.close()
            conn.close()
            return jsonify(result or {"success": False, "message": "User not found"}), 200 if result else 404
        except mysql.connector.Error as e:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": str(e)}), 500

    elif request.method == "PUT":
        data = request.get_json()
        required_fields = ["name", "phone", "location", "bio"]
        if not data or not all(field in data for field in required_fields):
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        name = data["name"].strip()
        phone = data["phone"].strip() if data["phone"] else None
        location = data["location"].strip() if data["location"] else None
        bio = data["bio"].strip()

        # Basic validation
        if len(name) < 2:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Name must be at least 2 characters"}), 400
        if len(bio) < 10:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Bio must be at least 10 characters"}), 400
        if phone and not phone.replace(" ", "").replace("-", "").isdigit():
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Phone must contain only digits, spaces, or dashes"}), 400

        try:
            cursor.execute("""
                UPDATE User 
                SET Name=%s, Phone=%s, Location=%s, Bio=%s
                WHERE UserId = %s
            """, (name, phone, location, bio, user_id))
            if cursor.rowcount == 0:
                cursor.close()
                conn.close()
                return jsonify({"success": False, "message": "User not found or no changes made"}), 404
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"success": True, "message": "Profile updated successfully"})
        except mysql.connector.Error as e:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": str(e)}), 400

@app.route("/skill/<int:skill_id>", methods=["DELETE"])
def delete_skill(skill_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        # Get userId from request
        data = request.get_json() or {}
        user_id = data.get("userId")
        if not user_id:
            return jsonify({"success": False, "message": "User ID required"}), 400

        # Check if skill exists and belongs to user
        cursor.execute("SELECT UserId FROM Skill WHERE SkillId = %s", (skill_id,))
        skill = cursor.fetchone()
        if not skill:
            return jsonify({"success": False, "message": "Skill not found"}), 404
        if skill["UserId"] != int(user_id):
            return jsonify({"success": False, "message": "Unauthorized: You can only delete your own skills"}), 403

        # Check for related requests
        cursor.execute("SELECT COUNT(*) AS count FROM Request WHERE SkillId = %s", (skill_id,))
        request_count = cursor.fetchone()["count"]
        if request_count > 0:
            return jsonify({"success": False, "message": "Cannot delete skill with associated requests"}), 400

        # Delete skill
        cursor.execute("DELETE FROM Skill WHERE SkillId = %s", (skill_id,))
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Skill not found"}), 404
        conn.commit()
        return jsonify({"success": True, "message": "Skill deleted successfully"})
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/create-skill", methods=["POST"])
def create_skill():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    try:
        cursor.execute("""
            INSERT INTO Skill (SkillName, Description, Category, UserId)
            VALUES (%s, %s, %s, %s)
        """, (data['skillName'], data['description'], data['category'], data['userId']))
        conn.commit()
        return jsonify({"success": True}), 201
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route("/skills", methods=["GET"])
def get_skills():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    user_id = request.args.get("userId")
    own_skills = request.args.get("ownSkills")
    try:
        if user_id and own_skills == "true":
            cursor.execute("""
                SELECT s.SkillId, s.SkillName, s.Description, s.Category, s.UserId
                FROM Skill s
                WHERE s.UserId = %s
            """, (int(user_id),))
        elif user_id:
            cursor.execute("""
                SELECT s.SkillId, s.SkillName, s.Description, s.Category, s.UserId, u.Name AS userName
                FROM Skill s JOIN User u ON s.UserId = u.UserId
                WHERE s.UserId != %s
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
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/create-request", methods=["POST"])
def create_request():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    try:
        cursor.execute("""
            INSERT INTO Request (UserId, SkillId, Status, TimeStamp)
            VALUES (%s, %s, 'Pending', NOW())
        """, (data['userId'], data['skillId']))
        conn.commit()
        return jsonify({"success": True}), 201
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route("/requests", methods=["GET"])
def get_user_requests():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    user_id = request.args.get("userId")
    try:
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
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/received-requests", methods=["GET"])
def get_received_requests():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    user_id = request.args.get("userId")
    try:
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
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/update-request", methods=["POST"])
def update_request():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    request_id = data.get("requestId")
    status = data.get("status")
    valid_statuses = ["Pending", "Accepted", "Rejected", "Completed"]
    if status not in valid_statuses:
        return jsonify({"success": False, "message": "Invalid status"}), 400
    try:
        cursor.execute("""
            UPDATE Request
            SET Status = %s
            WHERE RequestId = %s
        """, (status, request_id))
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Request not found"}), 404
        conn.commit()
        return jsonify({"success": True, "message": f"Request updated to {status}"})
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route("/complete-request", methods=["POST"])
def complete_request():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    request_id = data.get("requestId")
    try:
        # Update request status
        cursor.execute("""
            UPDATE Request
            SET Status = 'Completed'
            WHERE RequestId = %s
        """, (request_id,))
        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Request not found"}), 404

        # Create transaction
        cursor.execute("""
            INSERT INTO Transaction (RequestId, CompletionDate, Status)
            VALUES (%s, NOW(), 'Completed')
        """, (request_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Request completed and transaction created"})
    except mysql.connector.Error as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route("/transactions/<int:user_id>", methods=["GET"])
def get_transactions(user_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                t.TransactionId AS transactionId,
                r.RequestId AS requestId,
                s.SkillName AS skillName,
                COALESCE(
                    CASE 
                        WHEN r.UserId = %s THEN u_provider.Name
                        WHEN s.UserId = %s THEN u_requester.Name
                    END, 
                    'Unknown'
                ) AS userName,
                t.CompletionDate AS completionDate,
                t.Status AS status,
                CASE WHEN rv.Rating IS NOT NULL THEN 1 ELSE 0 END AS hasReview
            FROM Transaction t
            JOIN Request r ON t.RequestId = r.RequestId
            JOIN Skill s ON r.SkillId = s.SkillId
            JOIN User u_requester ON r.UserId = u_requester.UserId
            JOIN User u_provider ON s.UserId = u_provider.UserId
            LEFT JOIN Review rv ON t.TransactionId = rv.TransactionId
            WHERE r.UserId = %s OR s.UserId = %s
        """, (user_id, user_id, user_id, user_id))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except mysql.connector.Error as e:
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route("/submit-review", methods=["POST"])
def submit_review():
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    data = request.get_json()
    transaction_id = data.get("transactionId")
    rating = data.get("rating")
    comments = data.get("comments")
    
    if not all([transaction_id, rating, comments]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        # Check if review already exists
        cursor.execute("SELECT ReviewId FROM Review WHERE TransactionId = %s", (transaction_id,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "Review already submitted for this transaction"}), 400

        cursor.execute("""
            INSERT INTO Review (TransactionId, Rating, Comments)
            VALUES (%s, %s, %s)
        """, (transaction_id, rating, comments))
        conn.commit()
        return jsonify({"success": True, "message": "Review submitted successfully"})
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route("/")
def index():
    return "\u2705 Flask API is up."

if __name__ == '__main__':
    print("Flask server starting on http://127.0.0.1:5000")
    app.run(debug=True)