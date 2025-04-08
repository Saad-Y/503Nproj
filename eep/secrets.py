from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

VAULT_URL = "https://vault503n.vault.azure.net/"
credential = DefaultAzureCredential()
client = SecretClient(vault_url=VAULT_URL, credential=credential)
OPENAI_API_KEY = client.get_secret('OPENAI-API-KEY').value
mysql_password = client.get_secret("DB-PASSWORD").value
ssl_cert = client.get_secret("DigiCert-CA-Cert").value
SECRET_KEY = client.get_secret('SECRET-KEY').value
