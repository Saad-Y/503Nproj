from chromadb import HttpClient
from chromadb import PersistentClient
import os

LOCAL = os.getenv("LOCAL", "false")

if LOCAL == "false":    
    client = HttpClient(host='74.243.233.220', port=8000)

else:
    client = PersistentClient(path="./")
