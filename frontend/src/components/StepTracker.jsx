import { FaMusic, FaSearch, FaDownload } from "react-icons/fa";

const StepTracker = ({ currentStep = 1 }) => {
  const steps = [
    { icon: <FaMusic />, label: "Playlists" },
    { icon: <FaSearch />, label: "Tracks" },
    { icon: <FaDownload />, label: "Download" },
  ];

  return (
    <nav aria-label="Download progress" className="mb-8 py-6">
      <ol className="mx-auto flex max-w-2xl items-start justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = currentStep === stepNumber;
          const completed = currentStep > stepNumber;
          return (
            <li key={step.label} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-16 flex-col items-center gap-1.5">
                <div
                  aria-current={active ? "step" : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    active || completed
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-600 text-gray-500"
                  }`}
                >
                  {completed ? "✓" : step.icon}
                </div>
                <p
                  className={`text-center text-xs font-medium sm:text-sm ${
                    active || completed ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`mt-5 h-0.5 flex-1 transition-colors ${
                    completed ? "bg-primary" : "bg-gray-700"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepTracker;
