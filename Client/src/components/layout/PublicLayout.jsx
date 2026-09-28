import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "../common/Breadcrumbs";

function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <div className="public-layout">
      <Navbar />
      <Breadcrumbs />

      <main className="public-content">
        <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
