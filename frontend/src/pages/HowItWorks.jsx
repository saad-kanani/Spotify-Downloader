import React from "react";
import { FiCheck, FiDownload, FiLink, FiMousePointer } from "react-icons/fi";
import assets from "../assets/assets";

const steps = [
  {
    number: "01",
    icon: FiLink,
    image: assets.i1,
    title: "Copy a Spotify link",
    description:
      "Copy the public link for a track, album, or playlist from Spotify.",
  },
  {
    number: "02",
    icon: FiMousePointer,
    image: assets.i2,
    title: "Choose and paste",
    description:
      "Pick the matching tab on the home page, paste your link, and fetch its tracks.",
  },
  {
    number: "03",
    icon: FiDownload,
    image: assets.i3,
    title: "Select your queue",
    description:
      "Choose individual tracks or select up to six tracks for one ZIP download.",
  },
];

const HowItWorks = () => {
  return (
    <section className="mx-auto max-w-6xl px-2 py-8 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
            Simple by design
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            From link to listening in three steps.
          </h1>
        </div>
        <p className="max-w-lg text-base leading-7 text-grayMuted lg:justify-self-end">
          SpotiLoad keeps the workflow focused: bring a public Spotify link,
          choose what you want, and download a clean MP3 queue.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {steps.map(({ number, icon: Icon, image, title, description }) => (
          <article
            key={number}
            className="relative overflow-hidden rounded-lg border border-darkLight bg-dark"
          >
            <img
              src={image}
              alt={`${title} demonstration`}
              width="738"
              height="1453"
              className="block h-auto w-full"
            />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-widest text-primary">
                  {number}
                </span>
                <span className="rounded-md bg-darkMedium p-2 text-primary">
                  <Icon size={21} aria-hidden="true" />
                </span>
              </div>
              <h2 className="mt-10 text-xl font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-grayMuted">
                {description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-4 rounded-lg border border-darkLight bg-dark p-5 sm:p-7 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Your download checklist
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            A little preparation makes the queue smoother.
          </h2>
          <ul className="mt-5 grid gap-3 text-sm text-grayMuted sm:grid-cols-2">
            {[
              "Use a public Spotify link",
              "Keep the browser tab open",
              "Select no more than six tracks",
              "Check the current track status",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <FiCheck className="shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-darkMedium p-5">
          <p className="text-sm font-semibold text-white">Supported links</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["Track", "A single song"],
              ["Album", "A full release"],
              ["Playlist", "A curated collection"],
            ].map(([label, description]) => (
              <div
                key={label}
                className="rounded-md border border-darkLight px-3 py-2"
              >
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-grayMuted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
