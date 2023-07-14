import React from "react";
import "./Global.scss";
import styles from "./App.module.scss";
import { Route, Routes } from "react-router-dom";
import Main from "./Layouts/Main";
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";
import Home from "./pages/Home";

function App() {
  return (
    <div className={styles.App}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Main />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
