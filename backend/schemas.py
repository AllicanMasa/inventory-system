from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    price: float
    min_stock: int


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True


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
