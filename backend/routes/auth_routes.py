from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config.database import get_db
from service.auth_service import AuthService
from schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse, AdminCreate
from utils.auth_utils import get_current_user, require_admin
from schema.models import User


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user (regular user only).
    Admin accounts can only be created by other admins.
    """
    service = AuthService(db)
    try:
        user = service.register_user(
            full_name=user_data.full_name,
            email=user_data.email,
            password=user_data.password,
            whatsapp=user_data.whatsapp,
            role="user"  # Always register as regular user
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT access token.
    """
    service = AuthService(db)
    result = service.login(credentials.email, credentials.password)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah"
        )
    
    return result


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user info.
    """
    return current_user


# ==================== USER MANAGEMENT (Admin Only) ====================

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only).
    """
    service = AuthService(db)
    return service.get_all_users()


@router.get("/users/admins", response_model=List[UserResponse])
def get_admin_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all admin users (admin only).
    """
    service = AuthService(db)
    return service.get_users_by_role("admin")


@router.get("/users/regular", response_model=List[UserResponse])
def get_regular_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all regular users (admin only).
    """
    service = AuthService(db)
    return service.get_users_by_role("user")


@router.post("/users/admin", response_model=UserResponse, status_code=201)
def create_admin(
    admin_data: AdminCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new admin user (admin only).
    Only existing admins can create new admins.
    """
    service = AuthService(db)
    try:
        user = service.register_user(
            full_name=admin_data.full_name,
            email=admin_data.email,
            password=admin_data.password,
            role="admin"
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a user (admin only).
    Admins cannot delete themselves.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")
    
    service = AuthService(db)
    success = service.delete_user(user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    return {"message": "User berhasil dihapus"}
