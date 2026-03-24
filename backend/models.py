from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Numeric, TIMESTAMP, DateTime, Text, func
from sqlalchemy.sql import func
from backend.database import Base
from sqlalchemy.orm import relationship

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    role_id = Column(Integer, ForeignKey("roles.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    status = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_seen = Column(DateTime, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    sku = Column(String, unique=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    price = Column(Numeric)
    min_stock = Column(Integer)
    is_active = Column(Boolean, default=True) # Add this

    variants = relationship("ProductVariant", backref="product", cascade="all, delete")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)


# backend/models.py

class StockTransaction(Base):
    __tablename__ = "stock_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False) 
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    
    type = Column(String)
    direction = Column(String, nullable=True)
    quantity = Column(Integer)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=func.now())

    # --- ADD THESE RELATIONSHIPS ---
    variant = relationship("ProductVariant")
    user = relationship("User")          # <--- This fixes the 'user' error
    supplier = relationship("Supplier")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    size = Column(String(10))
    color = Column(String(50))
    sku = Column(String(100))
    quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True) # <--- Add this