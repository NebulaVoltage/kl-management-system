from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# The static files are in the same directory as the script.
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/login', methods=['POST'])
def erp_login():
    """
    Endpoint to handle ERP authentication and retrieve attendance data.
    This is currently a mock endpoint but will be wired up to the actual ERP system.
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')
    captcha = data.get('captcha')

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    # TODO: Implement actual ERP scraping logic here using requests/BeautifulSoup
    # For now, return mock attendance data to unblock frontend development.
    
    mock_courses = [
        {
            "courseName": "Data Structures & Algorithms",
            "conducted": 42,
            "attended": 35,
        },
        {
            "courseName": "Database Management Systems",
            "conducted": 38,
            "attended": 28,
        },
        {
            "courseName": "Computer Networks",
            "conducted": 40,
            "attended": 26, # 65% - Danger zone
        }
    ]

    return jsonify({
        "success": True,
        "message": "Login successful (mock)",
        "attendanceData": mock_courses
    })

if __name__ == '__main__':
    # Run the server on port 5000
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
