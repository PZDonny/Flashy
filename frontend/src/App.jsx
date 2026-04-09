import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ViewSet from "./pages/ViewSet";
import Quiz from "./pages/Quiz";
import SetEditor from "./pages/SetEditor";
import ProtectedAuthRoute from "./components/ProtectedAuthRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedAuthRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/edit-set/:setId?" element={<SetEditor />} />
            <Route path="/sets/:setId" element={<ViewSet />} />
            <Route path="/sets/:setId/quiz" element={<Quiz />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
