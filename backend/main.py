from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from config.database import create_tables
from config.settings import get_settings
from routes import intent_routes, chat_routes, training_routes, auth_routes

# Import models to register them with SQLAlchemy
from schema import models


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup: Create database tables
    print("Creating database tables...")
    create_tables()
    print("Database tables created successfully!")
    
    # Create initial admin if not exists
    from config.database import SessionLocal
    from service.auth_service import AuthService
    db = SessionLocal()
    try:
        auth_service = AuthService(db)
        auth_service.create_initial_admin()
    finally:
        db.close()
    
    yield
    # Shutdown
    print("Application shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Chatbot PMB API",
    description="API untuk Chatbot Penerimaan Mahasiswa Baru - Universitas Katolik De La Salle Manado",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(intent_routes.router, prefix=settings.API_PREFIX)
app.include_router(chat_routes.router, prefix=settings.API_PREFIX)
app.include_router(training_routes.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    """Root endpoint - API information."""
    return {
        "message": "Chatbot PMB API",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
