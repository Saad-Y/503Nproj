from flask import Blueprint, request, jsonify , Response
import requests
import os
from database.database import db
from model.course import Course
IEP_COURSE_CREATOR_URL = os.getenv("IEP_COURSE_CREATOR_URL", "http://course_creator:5004")
from routes.auth_routes import token_required
iep_course_creator_routes = Blueprint("iep_course_creator_routes", __name__)

@iep_course_creator_routes.route("/iep/generate_course", methods=["POST"])
def generate_course():
    """Synchronous proxy endpoint"""
    data = request.get_json()
    try:
        # Forward headers (including cookies)
        headers = {
            "Content-Type": "application/json",
            "Cookie": request.headers.get("Cookie", ""),  # Critical for auth
        }

        # Disable streaming, wait for full response
        resp = requests.post(
            f"{IEP_COURSE_CREATOR_URL}/generate_course",
            json=data,
            headers=headers,  # Forward cookies for auth
            timeout=120  # Match backend timeout
        )
        resp.raise_for_status()

        # Forward entire response as-is
        return Response(
             
            resp.content,
            headers=resp.headers, 
            status=resp.status_code,
            content_type=resp.headers.get("Content-Type", "application/json")
        )

    except requests.RequestException as e:
        print(f"Error in proxy request: {e}")
        return jsonify({"error": str(e)}), 502
    
@iep_course_creator_routes.route("/iep/enrolled_courses", methods=["GET"])
@token_required
def enrolled_courses_api(username):
    try:
        # Assuming you have a function to get the enrolled courses for a user
        enrolled_courses = db.session.query(Course).filter_by(owner_username=username).all()
        if not enrolled_courses:
            return jsonify({'error': 'No courses found for this username'}), 404
        return jsonify([course.serialize() for course in enrolled_courses]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@iep_course_creator_routes.route("/iep/save_course", methods=["POST"])
@token_required
def save_course(username):
    try:
        data = request.get_json()
        course_name = data.get('course_name')
        modules = data.get('modules')
        if not course_name or not modules:
            return jsonify({"error": "Missing required parameters"}), 400
        course = Course(
            owner_username=username,
            title=course_name,
            modules=modules,  # Assuming modules is a list or dict
        )
        db.session.add(course)
        db.session.commit()
        return jsonify({"message": "Course created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@iep_course_creator_routes.route("/iep/get_course", methods=["GET"])
@token_required
def get_course(username):
    try:
        data = request.get_json()
        course_name = data.get('course_name')
        if not course_name:
            return jsonify({"error": "Missing required parameters"}), 400
        course = db.session.query(Course).filter_by(owner_username=username, title=course_name).first()
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        return jsonify(course.serialize()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

            

    