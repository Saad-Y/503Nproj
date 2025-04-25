import os
from dotenv import load_dotenv

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
mysql_password = os.getenv("DB_PASSWORD", "")
ssl_cert = os.getenv("DigiCert_CA_Cert", "")
SECRET_KEY = os.getenv('SECRET_KEY')
