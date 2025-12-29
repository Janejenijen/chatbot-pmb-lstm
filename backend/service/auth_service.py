from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from schema.models import User
from config.settings import get_settings


settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "chatbot-pmb-secret-key-2024"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and verify a JWT token."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def register_user(
        self, 
        full_name: str, 
        email: str, 
        password: str, 
        whatsapp: Optional[str] = None,
        role: str = "user"
    ) -> User:
        """Register a new user."""
        # Check if email already exists
        if self.get_user_by_email(email):
            raise ValueError("Email sudah terdaftar")
        
        # Create user
        user = User(
            full_name=full_name,
            email=email,
            password_hash=self.hash_password(password),
            whatsapp=whatsapp,
            role=role
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        if not user.is_active:
            return None
        return user
    
    def login(self, email: str, password: str) -> Optional[dict]:
        """Login and return access token."""
        user = self.authenticate_user(email, password)
        if not user:
            return None
        
        access_token = self.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role
            }
        }
    
    def get_all_users(self):
        """Get all users."""
        return self.db.query(User).order_by(User.created_at.desc()).all()
    
    def get_users_by_role(self, role: str):
        """Get users by role."""
        return self.db.query(User).filter(User.role == role).order_by(User.created_at.desc()).all()
    
    def delete_user(self, user_id: int) -> bool:
        """Delete a user."""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True
    
    def create_initial_admin(self):
        """Create initial admin if no admin exists."""
        admin_exists = self.db.query(User).filter(User.role == "admin").first()
        if not admin_exists:
            self.register_user(
                full_name="Administrator",
                email="admin@pmb.unikadelasalle.ac.id",
                password="admin123",
                role="admin"
            )
            print("[AUTH] Initial admin created: admin@pmb.unikadelasalle.ac.id / admin123")
            return True
        return False
