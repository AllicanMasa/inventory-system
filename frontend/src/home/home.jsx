import React from "react";
import Navbar from "../navbar/navbar";
import { Outlet } from "react-router-dom";
import './home.css'

const Home = () => {
  return (
    <div className="home">
      <section className="navbar">
        <Navbar />
      </section>
      
      <section className="pages">
        <Outlet/>
      </section>
    </div>
  );
};

export default Home;
