import { createBrowserRouter } from "react-router-dom";
import Layout from "../layouts/layout";
import HomePage from "../pages/HomePage";
import HowItWorks from "../pages/HowItWorks";
import FAQPage from "../pages/FAQPage";
import PlaylistPage from "../pages/PlaylistPage";
import TracksPage from "../pages/TracksPage";
import DownloadPage from "../pages/DownloadPage";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  // Public student routes
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/how-it-works",
        element: <HowItWorks />,
      },
      {
        path: "/faq",
        element: <FAQPage />,
      },
      {
        path: "/playlist",
        element: (
          <ProtectedRoute>
            <PlaylistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/tracks",
        element: (
          <ProtectedRoute>
            <TracksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/download",
        element: (
          <ProtectedRoute>
            <DownloadPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);
