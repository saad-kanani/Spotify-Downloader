import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { MdMenu } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FiHelpCircle, FiHome, FiInfo, FiArrowRight } from "react-icons/fi";

const mobileLinks = [
  { to: "/", label: "Home", icon: FiHome },
  { to: "/how-it-works", label: "How It Works", icon: FiInfo },
  { to: "/faq", label: "FAQ", icon: FiHelpCircle },
];

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-5">
      <img
        src={assets.logo}
        alt="SpotiLoad"
        className="w-auto  cursor-pointer"
        onClick={() => navigate("/")}
      />
      <ul className="hidden md:flex items-start gap-10 font-medium">
        <NavLink to="/">
          <li className="pb-1">Home</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </NavLink>
        <NavLink to="/how-it-works">
          <li className="pb-1">How It Works</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </NavLink>
        <NavLink to="/faq">
          <li className="pb-1">FAQ</li>
          <hr className="border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden" />
        </NavLink>
      </ul>
      {/* <button className="hidden bg-[#1db954] text-white py-3 px-4 rounded-full cursor-pointer md:block">
        Create an Account
      </button> */}
      <p className="hidden text-sm text-gray-400 md:block">
        Download Your Favorite Tracks, Albums & Playlists
      </p>
      <div className="md:hidden">
        <MdMenu
          size={28}
          aria-hidden="true"
          onClick={() => setShowMenu(true)}
          className="cursor-pointer text-grayMuted transition-colors hover:text-white"
        />

        {showMenu && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setShowMenu(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-black/60"
            />
            <div className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col border-l border-darkLight bg-darkMedium px-5 py-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-darkLight pb-5">
                <img
                  src={assets.logo}
                  onClick={() => {
                    navigate("/");
                    setShowMenu(false);
                  }}
                  alt="SpotiLoad home"
                  className="w-auto cursor-pointer"
                />
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setShowMenu(false)}
                  className="rounded-full p-2 text-grayMuted transition-colors hover:bg-darkLight hover:text-white"
                >
                  <IoMdClose size={24} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-grayMuted">
                Explore SpotiLoad
              </p>
              <ul className="mt-3 flex flex-col gap-2 font-medium">
                {mobileLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setShowMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-grayMuted hover:bg-darkLight hover:text-white"
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={19} aria-hidden="true" />
                      {label}
                    </span>
                    <FiArrowRight size={17} aria-hidden="true" />
                  </NavLink>
                ))}
              </ul>
              <div className="mt-auto rounded-lg border border-darkLight bg-dark p-4">
                <p className="text-sm font-medium text-white">
                  Download freely
                </p>
                <p className="mt-1 text-xs leading-5 text-grayMuted">
                  Tracks, albums, and playlists in one place.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
