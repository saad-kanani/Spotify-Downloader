import React, { useState } from "react";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";

const questions = [
  {
    question: "What can I download?",
    answer:
      "You can paste a public Spotify track, album, or playlist link. The app fetches the available track details and lets you download individual tracks or selected tracks as a ZIP.",
  },
  {
    question: "Do I need Spotify Premium?",
    answer:
      "No. The app works with public Spotify links and does not require a Spotify Premium account or Spotify login.",
  },
  {
    question: "How many tracks can I download at once?",
    answer:
      "You can select up to six tracks for a bulk ZIP download. Individual track downloads are still available from each track row or card.",
  },
  {
    question: "Why can a track fail to download?",
    answer:
      "The matching audio may not be available on YouTube, the Spotify item may be a local or unavailable track, or the source may be restricted in your region. You can retry or download another track.",
  },
  {
    question: "Where does the audio come from?",
    answer:
      "Spotify is used for public metadata such as the title, artist, album, and artwork. The download service searches for a matching publicly available YouTube result and converts its audio to MP3.",
  },
  {
    question: "Can I use SpotiLoad on my phone?",
    answer:
      "Yes. The track list switches to a mobile card layout, and you can select tracks and start downloads from your phone. Keep the page open while a download is processing.",
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-5xl px-2 py-8 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
            Help center
          </p>
          <h1 className="max-w-md text-4xl font-bold leading-tight text-white sm:text-5xl">
            Questions, answered clearly.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-grayMuted">
            Everything you need to know before turning a Spotify link into a
            focused download queue.
          </p>
          <div className="mt-8 rounded-lg border border-darkLight bg-dark p-4">
            <p className="text-sm font-semibold text-white">Quick facts</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-grayMuted">media types</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">6</p>
                <p className="text-grayMuted">tracks per ZIP</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={item.question}
                className={`rounded-lg border transition-colors ${
                  isOpen
                    ? "border-primary/60 bg-dark"
                    : "border-darkLight bg-darkMedium"
                }`}
              >
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                  >
                    <span className="font-semibold text-white">
                      {item.question}
                    </span>
                    <FiChevronDown
                      size={20}
                      aria-hidden="true"
                      className={`shrink-0 text-grayMuted transition-transform ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                </h2>
                {isOpen && (
                  <div id={panelId} className="px-4 pb-5 sm:px-5">
                    <p className="border-t border-darkLight pt-4 text-sm leading-7 text-grayMuted">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQPage;
