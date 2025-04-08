from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import openai
from routes.document_upload import document_upload_route
from routes.auth_routes import auth_routes
from database.database import db
import os
from secrets import OPENAI_API_KEY, mysql_password, ssl_cert

openai.api_key = OPENAI_API_KEY

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.register_blueprint(document_upload_route)
app.register_blueprint(auth_routes)

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

    if app.config["SQLALCHEMY_DATABASE_URI"]:
        db.create_all()


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3000)
    