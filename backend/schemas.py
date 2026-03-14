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