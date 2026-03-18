from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine
from backend import models
from backend.routes import products, categories, users, suppliers


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
