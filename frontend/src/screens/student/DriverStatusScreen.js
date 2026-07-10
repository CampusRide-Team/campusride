// index.js
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  MessageSquare,
  Car,
  Shield,
  Home,
  Bell,
  User,
  Star,
} from "lucide-react";
import rideMap from "@/assets/ride-map.jpg";
import driverKwame from "@/assets/driver-kwame.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Driver Status — Campus Rides" },
      { name: "description", content: "Your driver has arrived. Track your ride live and verify your driver before entering the vehicle." },
      { property: "og:title", content: "Driver Status — Campus Rides" },
      { property: "og:description", content: "Your driver has arrived. Track your ride live and verify your driver before entering the vehicle." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-background flex flex-col pb-24">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-4 bg-card">
          <button aria-label="Back" className="text-primary">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-primary font-semibold text-lg">Driver Status</h1>
          <button aria-label="More" className="text-primary">
            <MoreVertical className="h-6 w-6" />
          </button>
        </header>

        {/* Header text */}
        <section className="px-5 pt-2 pb-5">
          <h2 className="text-3xl font-bold text-primary leading-tight">
            Your driver has arrived
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Your ride is waiting at the North Gate entrance.
          </p>
        </section>

        {/* Map card */}
        <section className="mx-5 rounded-3xl overflow-hidden bg-card shadow-sm">
          <div className="relative">
            <img
              src={rideMap}
              alt="Live ride map showing driver location"
              className="w-full h-48 object-cover"
              width={1024}
              height={512}
            />
            <div className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-primary">LIVE</span>
            </div>
          </div>
        </section>

        {/* Driver info */}
        <section className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={driverKwame}
              alt="Kwame, your driver"
              className="h-16 w-16 rounded-full object-cover"
              width={512}
              height={512}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-foreground">Kwame</p>
              <div className="flex items-center gap-1 text-sm font-semibold text-accent">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span>4.9</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-accent">2.4k Rides</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Plate
              </p>
              <div className="mt-1 rounded-lg border border-border bg-secondary px-3 py-1.5">
                <p className="text-sm font-bold text-primary leading-tight">
                  CR-2024-<br />EDU
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="mt-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">White Toyota Camry</p>
              <p className="text-sm text-muted-foreground">
                Standard Sedan • AC Enabled
              </p>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Call driver"
                className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                aria-label="Message driver"
                className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Track button */}
          <button className="mt-5 w-full rounded-2xl bg-primary py-4 text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition">
            Live Ride Tracking
          </button>
        </section>

        {/* Safety check */}
        <section className="mx-5 mt-5 rounded-3xl bg-secondary p-5 flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Safety Check:</span>{" "}
            Verify the license plate and driver photo before entering the vehicle. Enjoy your Ride.
          </p>
        </section>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 flex justify-around">
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
      className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition ${
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