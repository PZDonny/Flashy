import os
from flask import Flask
from flask_cors import CORS
from datetime import timedelta
from dotenv import load_dotenv
from routes.auth_routes import auth_bp
from routes.flashcard_routes import flashcard_bp
from routes.quiz_routes import quiz_bp
from routes.misc_routes import misc_bp

import extensions
import redis_client


load_dotenv()

DB_URI = 'postgresql://user:password@localhost:5435/flashy'
SECRET_KEY = os.getenv('JWT_SECRET_KEY')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = DB_URI
    app.config['JWT_SECRET_KEY'] = SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    CORS(app)

    extensions.db.init_app(app)
    extensions.jwt.init_app(app)

    redis_client.start(REDIS_PORT)

    with app.app_context():
        extensions.db.create_all()

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(flashcard_bp, url_prefix='/api')
    app.register_blueprint(quiz_bp, url_prefix='/api')
    app.register_blueprint(misc_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)