"""
Sportfolio ML Service Runner
Run this to start the Flask ML server
"""
import os
import sys

# add ml directory to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    print(f"🚀 Sportfolio ML Service starting on port {port}")
    print(f"   Health: http://localhost:{port}/health")
    print(f"   Entry Fee: POST http://localhost:{port}/predict/entry-fee")
    app.run(host='0.0.0.0', port=port, debug=False)