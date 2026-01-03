import { Toaster} from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import NotFound from "./pages/NotFound.jsx";
import ExploreDonate from "./pages/ExploreDonate.jsx";

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />

      <BrowserRouter>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home/donate" element={<ExploreDonate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
