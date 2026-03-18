from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Numeric, TIMESTAMP
from sqlalchemy.sql import func
from backend.database import Base


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


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    type = Column(String)
    quantity = Column(Integer)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())