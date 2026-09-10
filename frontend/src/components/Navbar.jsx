import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { MdMenu } from "react-icons/md";
import { IoMdClose } from "react-icons/io";

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
          <hr className="border-none outline-none h-0.5 bg-[#1db954] w-3/5 m-auto hidden" />
        </NavLink>
        <NavLink to="/how-it-works">
          <li className="pb-1">How It Works</li>
          <hr className="border-none outline-none h-0.5 bg-[#1db954] w-3/5 m-auto hidden" />
        </NavLink>
        <NavLink to="/faq">
          <li className="pb-1">FAQ</li>
          <hr className="border-none outline-none h-0.5 bg-[#1db954] w-3/5 m-auto hidden" />
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
          size={40}
          className="md:hidden"
          onClick={() => setShowMenu(true)}
        />

        {/* Modile Menu */}
        <div
          className={`${
            showMenu ? "fixed w-full" : "h-0 w-0"
          } md:hidden right-0 bottom-0 top-0 z-50 overflow-hidden bg-darkMedium transition-all`}
        >
          <div className="flex items-center justify-between px-5 py-6">
            <img
              src={assets.logo}
              onClick={() => {
                navigate("/");
                setShowMenu(false);
              }}
              alt="logo"
            />
            <IoMdClose size={35} onClick={() => setShowMenu(false)} />
          </div>
          <ul className="flex flex-col gap-2 items-center mt-5 px-5 text-lg font-medium">
            <NavLink onClick={() => setShowMenu(false)} to="/">
              <li className="px-4 py-2 rounded inline-block">Home</li>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/how-it-works">
              <li className="px-4 py-2 rounded inline-block">How It Works</li>
            </NavLink>
            <NavLink onClick={() => setShowMenu(false)} to="/faq">
              <li className="px-4 py-2 rounded inline-block">FAQ</li>
            </NavLink>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
