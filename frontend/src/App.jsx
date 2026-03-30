import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateSet from "./pages/CreateSet";
import ViewSet from "./pages/ViewSet";
import Quiz from "./pages/Quiz";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-set" element={<CreateSet />} />
          <Route path="/sets/:setId" element={<ViewSet />} />
          <Route path="/sets/:setId/quiz" element={<Quiz />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
