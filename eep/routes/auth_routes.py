import logging
from flask import request, abort, Blueprint, jsonify, make_response
import jwt
import datetime
from argon2 import PasswordHasher
from argon2.low_level import Type
from database.database import db
from model.user import User
from functools import wraps
import sys
from secrets import SECRET_KEY


auth_routes = Blueprint('auth_routes', __name__)

hasher = PasswordHasher(
    time_cost=2,              # Number of iterations
    memory_cost=19 * 1024,    # Memory in KB (19 MiB here)
    parallelism=1,            # Degree of parallelism
    hash_len=32,              # Desired key length (e.g., 256-bit key for AES-256)
    type=Type.ID               # Specifies Argon2id variant
)


def create_token(username): 
    payload = { 
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=2), 
        'iat': datetime.datetime.utcnow(), 
        'sub': username, 
    } 
    return jwt.encode( 
        payload, 
        SECRET_KEY, 
        algorithm='HS256' 
    ) 

def extract_auth_token(authenticated_request): 
    auth_header = authenticated_request.headers.get('Authorization') 
    if auth_header: 
        return auth_header.split(" ")[1] 
    else: 
        return None 
def decode_token(token): 
    payload = jwt.decode(token, SECRET_KEY, 'HS256') 
    return payload['sub'] 

def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = request.cookies.get('learnify-token')
        if not token:
            abort(403)
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            username = data['sub']
        except:
            logging.warning(f"Access to {f} Attempted with bad token")
            abort(403)
        return f(username, *args, **kwargs)
    return decorator

@auth_routes.route('/auth_check', methods=['GET'])
@token_required
def auth_check(username):
    return jsonify({"message": "Token valid", "user": username}), 200


@auth_routes.route('/login', methods=['POST' , 'OPTIONS'])
def authenticate():
    if request.method == 'OPTIONS':
        return '', 204
    username = request.json['username']
    password = request.json['password']
    if username=="" or password=="" or type(username)!=str or type(password)!=str:
        logging.error(f'invalid format of credentials')
        abort(400)
    user = db.session.query(User).filter_by(username=username).first()
    try:
        hasher.verify(user.hashed_password, password)
    except Exception as e:
        abort(403)
    token = create_token(username)
    resp = make_response({"message": "authentication successful"})
    resp.set_cookie('learnify-token', token, 
                        httponly=True, #to prevent javascript from accessing cookie
                        secure=True,         
                        samesite='None')
    logging.info(f'Login successful by {username}')
    return resp

@auth_routes.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'message': 'Logged out'})
    response.set_cookie('learnify-token', '', expires=0, httponly=True, samesite='None')
    return response

@auth_routes.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        # Respond to CORS preflight
        return '', 204
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Input validation
    if not username or not password or not isinstance(username, str) or not isinstance(password, str):
        logging.error("Invalid format for credentials during signup")
        abort(400, description="Invalid input")

    # Check if user already exists
    existing_user = db.session.query(User).filter_by(username=username).first()
    if existing_user:
        logging.warning(f"Attempt to register with existing username: {username}")
        abort(409, description="Username already taken")

    try:
        # Hash the password
        hashed_password = hasher.hash(password)

        # Create user and insert into DB
        new_user = User(username=username, hashed_password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        # Create token
        token = create_token(username)
        resp = make_response({"message": "Signup successful"})
        resp.set_cookie('learnify-token', token,
                        httponly=True,
                        secure=True,         
                        samesite='None')
        logging.info(f"User registered: {username}")
        return resp

    except Exception as e:
        logging.error(f"Signup error: {str(e)}")
        db.session.rollback()
        abort(500, description="Internal server error")
