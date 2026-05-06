import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import DonatePage from "./pages/DonatePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PaymentResult from "./pages/PaymentResult.jsx";
import NotFound from "./pages/NotFound.jsx";
import CampaignPage from "./pages/CampaignPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import CampaignDetailPage from "./pages/CampaignDetailPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

function App() {
  return (
    <BrowserRouter>
      {/* Toaster để hiển thị toast */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#151824',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/donate" element={<ExplorePage />} />
          <Route path="/donate/:username" element={<DonatePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="/campaign" element={<CampaignPage />} />
          <Route path="/campaign/create" element={<ProjectDetailPage />} />
          <Route path="/campaign/:slug" element={<CampaignDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;