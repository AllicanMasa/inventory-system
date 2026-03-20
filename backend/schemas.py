from datetime import datetime, timezone
from pydantic import BaseModel, field_serializer
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    price: float
    min_stock: int

class ProductResponse(ProductCreate):
    id: int

    model_config = {
        "from_attributes": True
    }

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthUser(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department_id: int | None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
    permissions: list[str]

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class SupplierBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class UserCreate(BaseModel):
    name: str
    email: str
    role_id: int
    department_id: Optional[int]
    status: Optional[bool] = True
    password: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str]
    email: Optional[str]
    role_id: Optional[int]
    department_id: Optional[int]
    status: Optional[bool]
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role_id: int
    department_id: Optional[int]
    status: bool

    model_config = {
        "from_attributes": True
    }

class RoleOut(BaseModel):
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }

class DepartmentOut(BaseModel):
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }

class AuditLogOut(BaseModel):
    id: int
    user_id: int
    name: str
    action: str
    created_at: datetime

    @field_serializer('created_at')
    def serialize_created_at(self, v: datetime) -> str:
        # Force UTC representation
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v.isoformat()   # → "2026-03-19T13:56:19+00:00"

    model_config = {
        "from_attributes": True
    }