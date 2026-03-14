import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "./login/login";
import Home from "./home/home";
import Dashboard from "./dashboard/dashboard";
import Product from "./product/product";
import Users from "./users/users";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/home" element={<Home />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="product" element={<Product />} />
          <Route path="users" element={<Users />} />F
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
