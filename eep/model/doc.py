from database.database import db

class Doc(db.Model):
    __tablename__ = 'document'

    id = db.Column(db.Integer, primary_key=True)
    owner_username = db.Column(db.String(150), nullable=False)
    title = db.Column(db.String(255), nullable=False)
