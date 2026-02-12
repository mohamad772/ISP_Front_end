import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/auth-store";

export function WelcomePage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [progress, setProgress] = useState(0);
  const destinationLabel = user?.role === "CLIENT" ? "client portal" : "dashboard";
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    // Generate random particles
    const particleArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
    }));
    setParticles(particleArray);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // Navigate after 3 seconds
    const timeoutId = window.setTimeout(() => {
      const target = user?.role === "CLIENT" ? "/client" : "/dashboard";
      navigate(target, { replace: true });
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, [navigate, user?.role]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#10172B]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#10172B] via-[#1a2342] to-[#10172B]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 h-96 w-96 animate-blob rounded-full bg-blue-500 mix-blend-screen blur-3xl filter"></div>
          <div className="animation-delay-2000 absolute top-0 right-1/4 h-96 w-96 animate-blob rounded-full bg-purple-500 mix-blend-screen blur-3xl filter"></div>
          <div className="animation-delay-4000 absolute -bottom-32 left-1/2 h-96 w-96 animate-blob rounded-full bg-indigo-500 mix-blend-screen blur-3xl filter"></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute h-1 w-1 animate-float rounded-full bg-[#F4F6FB]"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Geometric shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 animate-spin-slow rounded-full border-2 border-[#F4F6FB]"></div>
        <div className="absolute -bottom-24 -left-24 h-96 w-96 animate-spin-slow-reverse rounded-full border-2 border-[#F4F6FB]"></div>
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow border-2 border-[#F4F6FB]"></div>
      </div>

      {/* Main content */}
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Glass card with advanced animations */}
          <div
            className="group relative overflow-hidden rounded-3xl border border-[#F4F6FB]/20 bg-[#F4F6FB]/5 p-12 text-center shadow-2xl backdrop-blur-xl transition-all duration-700 hover:border-[#F4F6FB]/40 hover:bg-[#F4F6FB]/10"
            style={{
              animation: "slideUp 0.8s ease-out, fadeIn 0.8s ease-out",
            }}
          >
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Logo/Icon animation */}
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 animate-ping-slow rounded-full bg-[#F4F6FB]/30"></div>
                  <div className="absolute inset-0 animate-spin-slow rounded-full border-4 border-t-[#F4F6FB] border-r-transparent border-b-transparent border-l-transparent"></div>
                  <div className="absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    <svg
                      className="h-8 w-8 animate-pulse text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Welcome label */}
              <p
                className="text-sm font-semibold tracking-[0.3em] text-[#F4F6FB]/60 uppercase"
                style={{
                  animation: "fadeIn 1s ease-out 0.2s both",
                }}
              >
                Welcome
              </p>

              {/* Main names with stagger animation */}
              <h1
                className="mt-6 bg-gradient-to-r from-[#F4F6FB] via-blue-200 to-[#F4F6FB] bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
                style={{
                  animation:
                    "slideUp 0.8s ease-out 0.4s both, shimmer 3s ease-in-out infinite",
                  backgroundSize: "200% auto",
                }}
              >
                Mohammed Noor Ali Al-Khalil
              </h1>

              <h2
                className="mt-4 bg-gradient-to-r from-[#F4F6FB] via-purple-200 to-[#F4F6FB] bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
                style={{
                  animation:
                    "slideUp 0.8s ease-out 0.6s both, shimmer 3s ease-in-out infinite 0.5s",
                  backgroundSize: "200% auto",
                }}
              >
                Mohammed Omar Fares Tuwair
              </h2>

              {/* Decorative line */}
              <div
                className="mx-auto mt-8 h-1 w-0 overflow-hidden rounded-full bg-gradient-to-r from-transparent via-[#F4F6FB] to-transparent"
                style={{
                  animation: "expandWidth 1s ease-out 0.8s both",
                }}
              ></div>

              {/* Loading message */}
              <p
                className="mt-8 text-base text-[#F4F6FB]/70"
                style={{
                  animation:
                    "fadeIn 1s ease-out 1s both, pulse 2s ease-in-out infinite 1s",
                }}
              >
                Redirecting to {destinationLabel}...
              </p>

              {/* Progress bar */}
              <div
                className="mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#F4F6FB]/10"
                style={{
                  animation: "fadeIn 1s ease-out 1.2s both",
                }}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg shadow-blue-500/50 transition-all duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                  }}
                >
                  <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
              </div>

              {/* Percentage */}
              <p
                className="mt-4 font-mono text-sm font-bold text-[#F4F6FB]/50"
                style={{
                  animation: "fadeIn 1s ease-out 1.4s both",
                }}
              >
                {progress}%
              </p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 h-24 w-24 border-t-2 border-l-2 border-[#F4F6FB]/20 transition-all duration-500 group-hover:border-[#F4F6FB]/40"></div>
            <div className="absolute bottom-0 right-0 h-24 w-24 border-b-2 border-r-2 border-[#F4F6FB]/20 transition-all duration-500 group-hover:border-[#F4F6FB]/40"></div>
          </div>

          {/* Bottom decorative elements */}
          <div
            className="mt-8 flex items-center justify-center gap-2"
            style={{
              animation: "fadeIn 1s ease-out 1.6s both",
            }}
          >
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[#F4F6FB]/40"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[#F4F6FB]/40"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="h-2 w-2 animate-bounce rounded-full bg-[#F4F6FB]/40"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes expandWidth {
          from {
            width: 0;
          }
          to {
            width: 16rem;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          50% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-200vh) translateX(-20px);
            opacity: 0;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-slow-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.2;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
