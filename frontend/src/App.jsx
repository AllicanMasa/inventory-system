import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./login/login";
import Home from "./home/home";
import Dashboard from "./dashboard/dashboard";
import Product from "./product/product";
import Categories from "./categories/categories";
import Suppliers from "./suppliers/suppliers";
import Inventory from "./inventory/inventory";
import Users from "./users/users";
import AuditLogs from "./auditlogs/auditlogs";
import TransactionHistory from "./inventory/transactionhistory";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="product" element={<Product />} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="users" element={<Users />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="transactionhistory" element={<TransactionHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
