import React from "react";
import { Outlet } from "react-router-dom";
import styles from "./index.module.scss";

function index() {
  return (
    <div className={styles.main}>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default index;
