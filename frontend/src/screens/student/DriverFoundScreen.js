// index.js
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  MoreVertical,
  Check,
  Armchair,
  Star,
  Phone,
  MessageSquare,
  Car,
  Crosshair,
  Home,
  Bell,
  User,
  BadgeCheck,
} from "lucide-react";
import driverDaniel from "@/assets/driver-daniel.jpg";
import riderAlex from "@/assets/rider-alex.jpg";
import riderMarcus from "@/assets/rider-marcus.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Driver Found — Campus Rides" },
      { name: "description", content: "Your ride is on the way. Track your driver and see nearby campus rides." },
      { property: "og:title", content: "Driver Found — Campus Rides" },
      { property: "og:description", content: "Your ride is on the way. Track your driver and see nearby campus rides." },
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
          <h1 className="text-primary font-semibold text-lg">Driver Found</h1>
          <button aria-label="More" className="text-primary">
            <MoreVertical className="h-6 w-6" />
          </button>
        </header>

        {/* Success */}
        <section className="flex flex-col items-center pt-6 pb-4">
          <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <Check className="h-10 w-10 text-primary" strokeWidth={3} />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-foreground">Driver Found!</h2>
        </section>

        {/* Driver card */}
        <section className="mx-4 rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Estimated Arrival
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">3 mins away</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5">
              <Armchair className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">3 seats</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={driverDaniel}
                  alt="Daniel Miller"
                  className="h-16 w-16 rounded-full object-cover"
                />
                <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 text-accent fill-accent [&>path]:stroke-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Daniel Miller</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" /> 4.9
                  </span>
                  <span>•</span>
                  <span>2,400+ rides</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Call driver"
                className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center text-primary hover:bg-secondary/80 transition"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                aria-label="Message driver"
                className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center text-primary hover:bg-secondary/80 transition"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Vehicle */}
          <div className="mt-5 rounded-xl bg-secondary p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-card flex items-center justify-center">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground leading-tight">White Toyota Camry</p>
              <p className="text-sm text-muted-foreground">Premium Campus Fleet</p>
            </div>
            <div className="rounded-md border border-border bg-card px-3 py-1.5 font-bold text-foreground tracking-wider">
              X-12-24
            </div>
          </div>

          {/* Track button */}
          <button className="mt-5 w-full rounded-xl bg-primary py-4 text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition">
            <Crosshair className="h-5 w-5" />
            Track Ride
          </button>
        </section>

        {/* Nearby */}
        <section className="mt-6 px-5">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold text-primary">Nearby Available Rides</h3>
              <p className="text-sm text-muted-foreground">Matching your Route</p>
            </div>
            <button className="text-sm font-semibold text-primary">See All</button>
          </div>

          <div className="mt-4 space-y-3">
            <RideItem
              img={riderAlex}
              name="Alex Chen"
              location="Engineering Bldg"
              seats={4}
              eta="3 min"
            />
            <RideItem
              img={riderMarcus}
              name="Marcus Thorne"
              location="Student Union"
              seats={4}
              eta="6 min"
            />
          </div>
        </section>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-3 flex justify-around">
          <NavItem icon={<Home className="h-5 w-5" />} label="Home" active />
          <NavItem icon={<Car className="h-5 w-5" />} label="Rides" />
          <NavItem icon={<Bell className="h-5 w-5" />} label="Alerts" />
          <NavItem icon={<User className="h-5 w-5" />} label="Profile" />
        </nav>
      </div>
    </div>
  );
}

function RideItem({ img, name, location, seats, eta }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 flex items-center gap-3">
      <img src={img} alt={name} className="h-12 w-12 rounded-full object-cover" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {location} • {seats} seats
        </p>
      </div>
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary whitespace-nowrap">
        {eta}
      </span>
      <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1.5">
        <User className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-bold text-primary">{seats}</span>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition ${
        active ? "bg-secondary text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}