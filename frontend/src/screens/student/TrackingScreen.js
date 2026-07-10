import { createFileRoute } from "@tanstack/react-router";
import {
  Crosshair,
  Flag,
  Car,
  MapPin,
  Star,
  Shield,
  Home,
  Bell,
  User,
} from "lucide-react";
import driverMarcus from "@/assets/driver-marcus.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "On the way — Campus Rides" },
      {
        name: "description",
        content:
          "Track your driver in real time. Marcus is on the way to your pickup — arriving in 5 minutes.",
      },
      { property: "og:title", content: "On the way — Campus Rides" },
      {
        property: "og:description",
        content:
          "Track your driver in real time. Marcus is on the way to your pickup.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col pb-24">
        {/* Map area */}
        <section className="relative h-[560px] overflow-hidden">
          {/* Realistic map base */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 560"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            {/* Base land color */}
            <rect width="400" height="560" fill="oklch(0.95 0.012 90)" />

            {/* Water (upper right coastline) */}
            <path
              d="M400 0 L400 160 C 340 150, 300 110, 260 60 C 230 20, 250 -10, 290 0 Z"
              fill="oklch(0.82 0.05 230)"
            />

            {/* Park (soft green block, lower left) */}
            <rect
              x="20"
              y="330"
              width="120"
              height="110"
              rx="6"
              fill="oklch(0.86 0.06 145)"
            />
            <circle cx="55" cy="365" r="7" fill="oklch(0.78 0.07 145)" />
            <circle cx="90" cy="390" r="9" fill="oklch(0.78 0.07 145)" />
            <circle cx="60" cy="410" r="6" fill="oklch(0.78 0.07 145)" />

            {/* City blocks / buildings */}
            {[
              [160, 30, 60, 50], [235, 25, 45, 40], [30, 40, 55, 60],
              [160, 100, 70, 55], [250, 90, 60, 60], [30, 120, 50, 45],
              [175, 175, 55, 60], [260, 170, 55, 50], [30, 190, 55, 55],
              [200, 260, 60, 55], [280, 250, 50, 55],
              [160, 330, 50, 45], [250, 330, 60, 50], [320, 260, 55, 60],
              [220, 400, 55, 50], [300, 400, 60, 55], [30, 260, 50, 50],
            ].map(([x, y, w, h], i) => (
              <rect
                key={i}
                x={x}
                y={y}
                width={w}
                height={h}
                rx="3"
                fill="oklch(0.90 0.015 90)"
                stroke="oklch(0.85 0.015 90)"
                strokeWidth="1"
              />
            ))}

            {/* Road grid — vertical */}
            {[10, 150, 245, 320].map((x, i) => (
              <rect
                key={`v${i}`}
                x={x}
                y="0"
                width={i === 1 ? 14 : 10}
                height="560"
                fill="oklch(0.98 0.005 90)"
              />
            ))}
            {/* Road grid — horizontal */}
            {[15, 90, 165, 245, 320, 395, 455].map((y, i) => (
              <rect
                key={`h${i}`}
                x="0"
                y={y}
                width="400"
                height={i === 3 ? 12 : 8}
                fill="oklch(0.98 0.005 90)"
              />
            ))}

            {/* One diagonal avenue for realism */}
            <path
              d="M0 500 L 400 90"
              stroke="oklch(0.98 0.005 90)"
              strokeWidth="12"
            />

            {/* Route path (kept dashed, drawn above roads) */}
            <path
              d="M100 460 C 160 380, 240 320, 220 200 S 280 100, 300 130"
              stroke="oklch(0.55 0.2 260)"
              strokeWidth="4"
              strokeDasharray="7 7"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>

          {/* Top bar chips */}
          <div className="absolute top-4 inset-x-0 px-5 flex items-center justify-between z-10">
            <div className="mx-auto flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-md">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-sm font-bold text-foreground">
                Arriving in 5 mins
              </span>
            </div>
            <button
              aria-label="Recenter map"
              className="absolute right-5 h-11 w-11 rounded-full bg-card shadow-md flex items-center justify-center text-primary"
            >
              <Crosshair className="h-5 w-5" />
            </button>
          </div>

          {/* Destination flag */}
          <div className="absolute top-[130px] right-[70px] flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-card shadow-md flex items-center justify-center">
              <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center">
                <Flag className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
              </div>
            </div>
            <span className="mt-1 h-2 w-2 rounded-full bg-primary/50" />
          </div>

          {/* Car icon in middle */}
          <div className="absolute top-[280px] left-1/2 -translate-x-1/2">
            <div className="h-20 w-20 rounded-3xl bg-[oklch(0.62_0.19_260)] shadow-xl flex items-center justify-center">
              <Car className="h-9 w-9 text-white" />
            </div>
          </div>

          {/* Pickup pin */}
          <div className="absolute bottom-[110px] left-[70px] flex flex-col items-center">
            <div className="h-14 w-14 rounded-full bg-card shadow-md flex items-center justify-center">
              <div className="h-11 w-11 rounded-full bg-accent flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary fill-primary" />
              </div>
            </div>
            <span className="mt-1 h-2 w-2 rounded-full bg-accent/60" />
          </div>

          {/* Status pill */}
          <div className="absolute bottom-6 left-5 inline-flex items-center gap-2 rounded-full bg-[oklch(0.62_0.19_260)] px-4 py-3 shadow-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-sm font-bold text-white">
              On the way to pickup
            </span>
          </div>
        </section>

        {/* Driver sheet */}
        <section className="-mt-4 rounded-t-3xl bg-card pt-3 pb-5 px-5 shadow-[0_-8px_24px_-12px_oklch(0.2_0.05_265_/_0.15)]">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />

          <div className="mt-5 flex items-start gap-4">
            <img
              src={driverMarcus}
              alt="Marcus Chen, your driver"
              className="h-20 w-20 rounded-full object-cover shrink-0"
              width={512}
              height={512}
            />
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  Marcus Chen
                </h1>
                <div className="flex items-center gap-1 text-base font-bold text-foreground">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span>4.9</span>
                </div>
              </div>
              <p className="mt-1 text-base text-muted-foreground">
                Honda Civic •{" "}
                <span className="font-bold text-foreground">ABC-1234</span>
              </p>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="font-bold text-[oklch(0.55_0.2_260)]">
                  2 seats left
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">ETA: 5:45 PM</span>
              </div>
            </div>
          </div>

          {/* Safety check */}
          <div className="mt-5 rounded-2xl bg-secondary p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">Safety Check:</span>{" "}
              Verify the license plate and driver photo before entering the
              vehicle. Enjoy your Ride!.
            </p>
          </div>
        </section>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 flex justify-around rounded-t-3xl">
          <NavItem icon={<Home className="h-6 w-6" />} label="Home" active />
          <NavItem icon={<Car className="h-6 w-6" />} label="Rides" />
          <NavItem icon={<Bell className="h-6 w-6" />} label="Alerts" />
          <NavItem icon={<User className="h-6 w-6" />} label="Profile" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition ${
        active
          ? "bg-secondary text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}