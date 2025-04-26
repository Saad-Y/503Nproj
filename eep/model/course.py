from database.database import db
from sqlalchemy.orm import relationship
class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True)
    owner_username = db.Column(db.String(150), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    modules = db.Column(db.JSON, nullable=False)  # Store modules as JSON
    
    def serialize(self):
        return {
            
            "title": self.title,
            "modules": self.modules,
        }

