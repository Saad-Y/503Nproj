from flask import Flask, request, jsonify, abort ,Response
from flask_cors import CORS
import openai
from routes.document_upload import document_upload_route
from routes.auth_routes import auth_routes
from routes.quiz_generation import quiz_routes
from routes.course_creator import iep_course_creator_routes
from database.database import db
import os
from secrets import OPENAI_API_KEY, mysql_password, ssl_cert
import requests
openai.api_key = OPENAI_API_KEY

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://0.0.0.0:80",
            "http://localhost:80",
            "http://frontend:80",
            "http://localhost",
            "https://20.233.221.128",
            "https://white-forest-06d13af00.6.azurestaticapps.net"
        ]}}, supports_credentials=True)
app.register_blueprint(document_upload_route)
app.register_blueprint(auth_routes)
app.register_blueprint(quiz_routes)
app.register_blueprint(iep_course_creator_routes)

@app.route('/', methods=['GET'])
def healthcheck():
    return jsonify({"status": "ok"}), 200



from flask import Response  # Add this import
SYNTHIZE_API = "audio_gen_iep:5003"  # Use Docker service name, not localhost

@app.route('/synthesize', methods=['POST'])
def proxy_synthesize():
    try:
        # Forward headers (including cookies)
        headers = {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("Cookie", ""),  # Critical for auth
        }

        # Forward request to backend
        resp = requests.post(
            f"http://{SYNTHIZE_API}/synthesize",
            json=request.get_json(),
            headers=headers,
            stream=True  # Stream binary response
        )

        # Return backend's response directly
        return Response(
            resp.iter_content(chunk_size=8192),  # Stream audio bytes
            status=resp.status_code,
            content_type=resp.headers.get("Content-Type", "audio/mpeg"),
        )

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    
# Connect to db
cert = "-----BEGIN CERTIFICATE-----\n" + '\n'.join([ssl_cert[i:i+64] for i in range(0, len(ssl_cert), 64)]) + "\n-----END CERTIFICATE-----"
os.makedirs('tmp', exist_ok=True)
cert_path = "./tmp/DigiCertGlobalRootCA.crt.pem"
with open(cert_path, "w") as f:
    f.write(cert)
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f'mysql+pymysql://learnify:{mysql_password}@learnifysqldb.mysql.database.azure.com:3306/learnifydb?'
    f'ssl_ca={cert_path}'
)
db.init_app(app)

with app.app_context():
    from model.user import User
    from model.doc import Doc
    from model.course import Course

    if app.config["SQLALCHEMY_DATABASE_URI"]:
        
        db.create_all()


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
    