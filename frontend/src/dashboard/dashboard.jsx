import React from "react";
import "../dashboard/dashboard.css";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { FaMoneyBillWave } from "react-icons/fa6";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { BsCalendar2Day } from "react-icons/bs";
import { BiPurchaseTagAlt } from "react-icons/bi";
import { TbShoppingCartCancel } from "react-icons/tb";
import { FaSortAmountUp } from "react-icons/fa";
import { MdOutlineAssignmentReturned } from "react-icons/md";
import Saleschart from "../dashboard/saleschart";
import Inventory from "../dashboard/inventorychart";
import DateTime from "../dashboard/datetime";


const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <h1><DateTime/></h1>
      <section className="container">
        <section className="sales">
          <h3>Sales Overview</h3>
          <div className="sales-con">
            <div className="stats">
              <p className="sales-icon">
                <FaMoneyBillTrendUp />
              </p>
              <p>Montly Sales</p>
              <h3>100</h3>
            </div>
            <div className="stats">
              <p className="sales-icon">
                <MdOutlineCalendarMonth />
              </p>
              <p>Montly Profit</p>
              <h3>100</h3>
            </div>
            <div className="stats">
              <p className="sales-icon">
                <FaMoneyBillWave />
              </p>
              <p>Daily Sales</p>
              <h3>100</h3>
            </div>
            <div className="stats">
              <p className="sales-icon">
                <BsCalendar2Day />
              </p>
              <p>Daily Profit</p>
              <h3>100</h3>
            </div>
          </div>
        </section>

        <section className="purchase">
          <h3>Purchase Overview</h3>
          <div className="purchase-con">
            <div className="purchase-stat">
              <p className="purchase-icon">
                <BiPurchaseTagAlt />
              </p>
              <p>No. of Purchase</p>
              <p>2</p>
            </div>
            <div className="purchase-stat">
              <p className="purchase-icon">
                <TbShoppingCartCancel />
              </p>
              <p>Cancel Order</p>
              <p>5</p>
            </div>
            <div className="purchase-stat">
              <p className="purchase-icon">
                <FaSortAmountUp />
              </p>
              <p>Purchase Amount</p>
              <p>100</p>
            </div>
            <div className="purchase-stat">
              <p className="purchase-icon">
                <MdOutlineAssignmentReturned />
              </p>
              <p>Returns</p>
              <p>8</p>
            </div>
          </div>
        </section>
      </section>

      <section className="charts">
        <div className="sales-chart">
          <h3>Sales Statistics</h3>
          <Saleschart />
        </div>

        <div className="inventory-chart">
          <h3>Inventory Stock Levels</h3>
          <Inventory />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
