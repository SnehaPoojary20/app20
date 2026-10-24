import { Link, Route, Routes } from "react-router-dom";
import Header from "./Components/Header/Header";
import Home from "./Components/Home/Home";
import Footer from "./Components/Footer/Footer";
import "./App.css";

function NotFound() {
  return (
    <main className="nf">
      <span>404</span>
      <h1>Off the grid.</h1>
      <p>That page doesn't exist.</p>
      <Link to="/">Back to dashboard</Link>
    </main>
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}
