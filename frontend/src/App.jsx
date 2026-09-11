// App.jsx
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "./router";
import { PlaylistProvider } from "./context/PlaylistContext";
import { TracksProvider } from "./context/TracksContext";

const App = () => {
  return (
    <PlaylistProvider>
      <TracksProvider>
        <div className="min-h-screen bg-darkMedium text-white px-[10px] py-[20px] md:px-[20px] md:py-[30px] lg:px-[140px]">
          <Toaster theme="dark" />
          <RouterProvider router={router} />
        </div>
      </TracksProvider>
    </PlaylistProvider>
  );
};

export default App;
