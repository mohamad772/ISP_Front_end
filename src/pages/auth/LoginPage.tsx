import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Wifi, Loader2, Lock, User, Shield, Zap, Signal } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import { useStore } from "@/store/auth-store";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);

  const { mutate, isPending } = useLogin();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isClientUser = user.role === "CLIENT" || Boolean(user.clientId);
    const target = isClientUser ? "/client" : "/dashboard";
    navigate(target, { replace: true });
  }, [isAuthenticated, user, navigate]);

  // Advanced particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = `hsl(var(--primary) / ${this.opacity})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle());
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        // Connect particles
        particles.slice(index + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `hsl(var(--primary) / ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const data = error.response?.data;
      if (data && typeof data === "object" && "message" in data) {
        const message = (data as { message?: string }).message;
        if (typeof message === "string" && message.trim()) {
          return message;
        }
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return t("Invalid credentials. Please try again.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    mutate(
      {
        username: username,
        password: password,
      },
      {
        onSuccess: (data) => {
          toast({
            title: t("Login successful"),
            description: t("Welcome back, {{name}}!", {
              name: data.user.username,
            }),
          });
          const isClientUser =
            data.user.role === "CLIENT" || Boolean(data.user.clientId);
          const target = isClientUser ? "/client" : "/welcome";
          const snapshot = useStore.getState();
          console.log("[Login] user:", snapshot.user);
          console.log("[Login] isAuthenticated:", snapshot.isAuthenticated);
          console.log("[Login] current path:", window.location.pathname);
          console.log("[Login] navigating to:", target);
          navigate(target);
          setTimeout(() => {
            console.log("[Login] path after navigate:", window.location.pathname);
          }, 0);
        },
        onError: (error) => {
          console.error(error);
          setLoginError(getErrorMessage(error));
          toast({
            title: t("Login failed"),
            description: getErrorMessage(error),
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background p-4 overflow-hidden">
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40"
      />

      {/* Dynamic Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl animate-morph-1 bg-primary/30"
          style={{
            left: `${mousePosition.x * 0.02}px`,
            top: `${mousePosition.y * 0.02}px`,
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-morph-2 bg-primary/25"
          style={{
            right: `${mousePosition.x * 0.03}px`,
            bottom: `${mousePosition.y * 0.03}px`,
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-15 blur-3xl animate-morph-3 bg-primary/20"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      {/* Spotlight Effect */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none transition-all duration-300 ease-out bg-primary/40"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Floating Signals Animation */}
        <div className="absolute -top-20 -left-20 w-40 h-40 opacity-20 animate-float-slow">
          <Signal className="w-full h-full text-primary animate-pulse-slow" />
        </div>
        <div className="absolute -bottom-20 -right-20 w-32 h-32 opacity-20 animate-float-delayed">
          <Zap className="w-full h-full text-primary animate-pulse-slower" />
        </div>

        {/* Logo Section with Advanced 3D Effect */}
        <div className="text-center mb-10 animate-fade-scale-in">
          <div className="relative inline-block mb-8 group">
            {/* Multiple glowing layers */}
            <div className="absolute inset-0 bg-primary/40 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 animate-glow-pulse" />
            <div className="absolute inset-0 bg-primary/30 rounded-[2rem] blur-xl opacity-40 animate-rotate-gradient" />

            {/* Main icon container with 3D transform */}
            <div
              className="relative inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-primary shadow-2xl shadow-primary/50 transform-gpu transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{
                transform: `perspective(1000px) rotateX(${(mousePosition.y - window.innerHeight / 2) * 0.01}deg) rotateY(${(mousePosition.x - window.innerWidth / 2) * 0.01}deg)`,
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Inner glow */}
              <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />

              <Wifi className="w-12 h-12 text-primary-foreground animate-signal-pulse relative z-10" />

              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-orbit">
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary-foreground rounded-full -translate-x-1/2 shadow-lg shadow-primary-foreground/50" />
              </div>
              <div
                className="absolute inset-0 animate-orbit-reverse"
                style={{ animationDelay: "1s" }}
              >
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-primary-foreground rounded-full -translate-x-1/2 shadow-lg shadow-primary-foreground/50" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
            ISP Manager
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm tracking-[0.2em] uppercase font-semibold">
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-primary" />
            <span>Premium Network Control</span>
            <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-primary" />
          </div>
        </div>

        {/* Login Card with Ultra-Modern Glass Effect */}
        <div
          className="relative animate-fade-slide-up group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Outer glow */}
          <div className="absolute -inset-1 bg-primary/30 rounded-[1.5rem] opacity-20 group-hover:opacity-30 blur-xl transition-opacity duration-500 animate-pulse-glow" />

          {/* Card container */}
          <Card className="relative border border-primary/20 shadow-2xl backdrop-blur-xl bg-card/95 overflow-hidden rounded-[1.5rem]">
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-[1.5rem] p-[1px] bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-[1px] rounded-[1.5rem] bg-card backdrop-blur-xl" />

            {/* Mesh gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-mesh-gradient" />

            {/* Content */}
            <div className="relative">
              <CardHeader className="space-y-2 pb-6 pt-8">
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                  <Shield className="w-7 h-7 text-primary animate-pulse-slow" />
                  {t("Secure Access")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t("Authenticate with your credentials to access the control panel")}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative pb-8">
                {loginError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTitle>{t("Login failed")}</AlertTitle>
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Username Field with Advanced Styling */}
                  <div className="space-y-3 animate-slide-fade-left">
                    <Label
                      htmlFor="username"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      {t("Username or email")}
                    </Label>
                    <div className="relative group/input">
                      {/* Glow effect */}
                      <div
                        className={`absolute -inset-1 bg-primary/30 rounded-xl opacity-0 group-hover/input:opacity-20 blur transition-all duration-500 ${focusedField === "username" ? "opacity-40" : ""}`}
                      />

                      <div className="relative">
                        {/* Icon */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                          <User
                            className={`w-5 h-5 transition-all duration-300 ${focusedField === "username" ? "text-primary scale-110" : "text-muted-foreground"}`}
                          />
                        </div>

                        {/* Input */}
                        <Input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t("Enter your username or email")}
                          className="h-14 pl-12 pr-4 border-2 rounded-xl transition-all duration-300 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/20"
                          required
                        />

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                          <div
                            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-1000 ${focusedField === "username" ? "translate-x-full" : ""}`}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("Client accounts sign in with email as username.")}
                    </p>
                  </div>

                  {/* Password Field with Advanced Styling */}
                  <div className="space-y-3 animate-slide-fade-right">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {t("Password")}
                    </Label>
                    <div className="relative group/input">
                      {/* Glow effect */}
                      <div
                        className={`absolute -inset-1 bg-primary/30 rounded-xl opacity-0 group-hover/input:opacity-20 blur transition-all duration-500 ${focusedField === "password" ? "opacity-40" : ""}`}
                      />

                      <div className="relative">
                        {/* Icon */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                          <Lock
                            className={`w-5 h-5 transition-all duration-300 ${focusedField === "password" ? "text-primary scale-110" : "text-muted-foreground"}`}
                          />
                        </div>

                        {/* Input */}
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t("Enter your password")}
                          className="h-14 pl-12 pr-4 border-2 rounded-xl transition-all duration-300 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/20"
                          required
                        />

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                          <div
                            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-1000 ${focusedField === "password" ? "translate-x-full" : ""}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Submit Button */}
                  <div
                    className="pt-4 animate-fade-scale-in"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-14 text-base font-bold relative overflow-hidden group/btn transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 disabled:hover:translate-y-0 rounded-xl"
                      disabled={isPending}
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />

                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

                      {/* Particle burst on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full animate-particle-burst"
                            style={{
                              left: "50%",
                              top: "50%",
                              animationDelay: `${i * 0.1}s`,
                              transform: `rotate(${i * 45}deg)`,
                            }}
                          />
                        ))}
                      </div>

                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="animate-pulse">
                              {t("Authenticating...")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>{t("Sign In")}</span>
                            <div className="group-hover/btn:translate-x-1 transition-transform duration-300 text-xl">
                              →
                            </div>
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </form>

                {/* Security Features */}
                <div
                  className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-in"
                  style={{ animationDelay: "0.4s" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>256-bit SSL</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>End-to-End Encrypted</span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Status Indicators */}
        <div
          className="mt-6 flex items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow shadow-lg shadow-green-500/50" />
            <span className="text-xs text-muted-foreground font-medium">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes morph-1 {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg) scale(1.1); }
        }

        @keyframes morph-2 {
          0%, 100% { border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%; transform: rotate(0deg) scale(1); }
          50% { border-radius: 60% 40% 40% 60% / 40% 60% 40% 60%; transform: rotate(-180deg) scale(1.1); }
        }

        @keyframes morph-3 {
          0%, 100% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: rotate(0deg) scale(1); }
          50% { border-radius: 70% 30% 50% 50% / 30% 70% 50% 50%; transform: rotate(90deg) scale(1.05); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-10deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes rotate-gradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes signal-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        @keyframes orbit {
          0% { transform: rotate(0deg) translateY(-40px) rotate(0deg); }
          100% { transform: rotate(360deg) translateY(-40px) rotate(-360deg); }
        }

        @keyframes orbit-reverse {
          0% { transform: rotate(360deg) translateY(-40px) rotate(-360deg); }
          100% { transform: rotate(0deg) translateY(-40px) rotate(0deg); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fade-scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-fade-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slide-fade-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        @keyframes border-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes mesh-gradient {
          0%, 100% { opacity: 1; transform: translateX(0) translateY(0); }
          33% { opacity: 0.8; transform: translateX(10px) translateY(-10px); }
          66% { opacity: 0.6; transform: translateX(-10px) translateY(10px); }
        }

        @keyframes particle-burst {
          0% { transform: translate(-50%, -50%) translateY(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-30px) scale(0); opacity: 0; }
        }

        .animate-morph-1 { animation: morph-1 20s ease-in-out infinite; }
        .animate-morph-2 { animation: morph-2 25s ease-in-out infinite; }
        .animate-morph-3 { animation: morph-3 30s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite 2s; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 4s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-rotate-gradient { animation: rotate-gradient 10s linear infinite; }
        .animate-signal-pulse { animation: signal-pulse 2s ease-in-out infinite; }
        .animate-orbit { animation: orbit 8s linear infinite; }
        .animate-orbit-reverse { animation: orbit-reverse 8s linear infinite; }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; background-size: 200% 200%; }
        .animate-fade-scale-in { animation: fade-scale-in 0.6s ease-out forwards; }
        .animate-fade-slide-up { animation: fade-slide-up 0.8s ease-out forwards; }
        .animate-slide-fade-left { animation: slide-fade-left 0.5s ease-out forwards; animation-delay: 0.1s; opacity: 0; }
        .animate-slide-fade-right { animation: slide-fade-right 0.5s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-border-flow { animation: border-flow 3s linear infinite; background-size: 200% 200%; }
        .animate-mesh-gradient { animation: mesh-gradient 10s ease-in-out infinite; }
        .animate-particle-burst { animation: particle-burst 0.8s ease-out forwards; }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}
