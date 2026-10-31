import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import Search from "./pages/Search";
import Recommendation from "./pages/Recommendation";
import RestaurantDetail from "./pages/RestaurantDetail";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Analyzing from "./pages/Analyzing";
import Result from "./pages/Result";
import MapScreen from "./pages/MapScreen";
import AdminDashboard from "./pages/AdminDashboard";
import DatasetManager from "./pages/DatasetManager";
import AITraining from "./pages/AITraining";
import Diary from "./pages/Diary";
import Stickers from "./pages/Stickers";
import Missions from "./pages/Missions";
import Rewards from "./pages/Rewards";
import FoodChat from "./pages/FoodChat";
import GroupDecision from "./pages/GroupDecision";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const activeTheme = useAppStore((state) => state.activeTheme);
  useEffect(() => {
    document.documentElement.dataset.rewardTheme = activeTheme;
  }, [activeTheme]);
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-3 md:p-6 pb-24 md:pb-6 max-w-[1600px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/thinking" element={<Analyzing />} />
            <Route path="/result" element={<Result />} />
            <Route path="/map" element={<MapScreen />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/history" element={<History />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/stickers" element={<Stickers />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/chat" element={<FoodChat />} />
            <Route path="/group" element={<GroupDecision />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dataset" element={<DatasetManager />} />
            <Route path="/admin/training" element={<AITraining />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
