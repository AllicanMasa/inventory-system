import React from "react";
import Navbar from "../navbar/navbar";
import Header from "../home/header";
import { Outlet } from "react-router-dom";
import './home.css'

const Home = () => {
  return (
    <div className="home">
      <section className="navbar">
        <Navbar />
      </section>
      
      <section className="pages">
        <div className="header-top">
        <Header/>
        </div>
        <div className="content">
        <Outlet/>
        </div>
      </section>
    </div>
  );
};

export default Home;
