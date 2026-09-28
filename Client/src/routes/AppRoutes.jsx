import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Loader from "../components/common/Loader";

import PublicLayout from "../components/layout/PublicLayout";
import AdminLayout from "../components/admin/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

import Home from "../pages/public/Home";
import Explore from "../pages/public/Explore";
import Characters from "../pages/public/Characters";
import Stories from "../pages/public/Stories";
import Events from "../pages/public/Events";
import Shop from "../pages/public/Shop";
import NotFound from "../pages/public/NotFound";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import FAQ from "../pages/public/FAQ";
import Multimedia from "../pages/public/Multimedia";
import Categories from "../pages/public/Categories";
import CategoryDetails from "../pages/public/CategoryDetails";
import CharacterDetails from "../pages/public/CharacterDetails";
import ArticleDetails from "../pages/public/ArticleDetails";
import EventDetails from "../pages/public/EventDetails";
import SitemapPage from "../pages/public/SitemapPage";
import Legal from "../pages/public/Legal";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";

import UserLayout from "../components/layout/UserLayout";
const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
const Bookmarks = lazy(() => import("../pages/user/Bookmarks"));
const Profile = lazy(() => import("../pages/user/Profile"));
const Submissions = lazy(() => import("../pages/user/Submissions"));
const ChatHistory = lazy(() => import("../pages/user/ChatHistory"));
const Notes = lazy(() => import("../pages/user/Notes"));

const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const Analytics = lazy(() => import("../pages/admin/Analytics"));
const Users = lazy(() => import("../pages/admin/Users"));
const Content = lazy(() => import("../pages/admin/Content"));
const ManageArticles = lazy(() => import("../pages/admin/ManageArticles"));
const ManageCategories = lazy(() => import("../pages/admin/ManageCategories"));
const ManageCharacters = lazy(() => import("../pages/admin/ManageCharacters"));
const ManageMultimedia = lazy(() => import("../pages/admin/ManageMultimedia"));
const ManageSubmissions = lazy(() => import("../pages/admin/ManageSubmissions"));
const EventsManagement = lazy(() => import("../pages/admin/EventsManagement"));
const Feedback = lazy(() => import("../pages/admin/Feedback"));
const ManageAI = lazy(() => import("../pages/admin/ManageAI"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const ManageMerchandise = lazy(() => import("../pages/admin/ManageMerchandise"));
const ManageReleases = lazy(() => import("../pages/admin/ManageReleases"));

function AppRoutes() {
  return (
    <Suspense fallback={<Loader label="Loading..." fullPage />}>
    <Routes>
      
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/characters" element={<Characters />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/events" element={<Events />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/multimedia" element={<Multimedia />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<CategoryDetails />} />
        <Route path="/characters/:id" element={<CharacterDetails />} />
        <Route path="/stories/:id" element={<ArticleDetails />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/sitemap" element={<SitemapPage />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/privacy" element={<Legal />} />

        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        
        <Route path="/Stories" element={<Navigate to="/stories" replace />} />
        <Route path="/Shop" element={<Navigate to="/shop" replace />} />
        <Route path="/articles" element={<Navigate to="/stories" replace />} />
        <Route path="/merchandise" element={<Navigate to="/shop" replace />} />
      </Route>

      
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="notes" element={<Notes />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="chat-history" element={<ChatHistory />} />
        </Route>
      </Route>

      
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />

          <Route path="users" element={<Users />} />
          <Route path="submissions" element={<ManageSubmissions />} />
          <Route path="feedback" element={<Feedback />} />

          <Route path="content" element={<Content />} />
          <Route path="articles" element={<ManageArticles />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="characters" element={<ManageCharacters />} />
          <Route path="multimedia" element={<ManageMultimedia />} />
          <Route path="ai" element={<ManageAI />} />
          <Route path="merchandise" element={<ManageMerchandise />} />
          <Route path="releases" element={<ManageReleases />} />

          <Route path="events" element={<EventsManagement />} />

          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;