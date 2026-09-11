from typing import Optional
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

class User(BaseModel):
    username: str
    role: str  # 'editor' or 'admin'

def get_current_user(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None)
) -> User:
    """
    Role-based access control dependency.
    Accepts role from X-User-Role header (editor/admin) or Authorization header.
    Defaults to 'editor' if unprovided.
    """
    role = "editor"
    username = "content_editor"

    # Check X-User-Role header first (simplifies testing, swagger, and CMS role switching)
    if x_user_role:
        clean_role = x_user_role.strip().lower()
        if clean_role in ["admin", "editor"]:
            role = clean_role
            username = f"{role}_user"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{x_user_role}'. Allowed roles: 'editor', 'admin'."
            )
    elif authorization:
        # Simple bearer token parsing (e.g. Bearer admin-token / Bearer editor-token)
        token = authorization.replace("Bearer ", "").strip().lower()
        if "admin" in token:
            role = "admin"
            username = "admin_user"
        elif "editor" in token:
            role = "editor"
            username = "editor_user"

    return User(username=username, role=role)

def require_editor(user: User = None) -> User:
    """Ensures user has editor or admin privileges."""
    if not user:
        user = get_current_user()
    if user.role not in ["editor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Requires editor or admin role."
        )
    return user

def require_admin(user: User = None) -> User:
    """
    Strictly ensures user has admin role.
    Raises 403 Forbidden for editor users trying to publish or perform admin actions.
    """
    if not user:
        user = get_current_user()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Publishing and admin operations require admin role. You currently have 'editor' role."
        )
    return user
