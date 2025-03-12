import { FoodOrderBot } from "./components/FoodOrderBot";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FoodOrderBot />} />
      </Routes>
    </Router>
  );
}
