"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  Menu,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Zap,
    title: "Smart Task Distribution",
    description:
      "Automatically distribute household tasks across eligible members with a fair rotation system.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Rotation",
    description:
      "Recurring tasks rotate between members so responsibilities can be shared over time.",
  },
  {
    icon: ShieldCheck,
    title: "Permanent Responsibilities",
    description:
      "Assign fixed responsibilities when a task should always belong to one household member.",
  },
  {
    icon: Users,
    title: "Temporary & Guest Tasks",
    description:
      "Create temporary tasks for guests, special occasions, or short-term household needs.",
  },
  {
    icon: CheckCircle2,
    title: "Completion Tracking",
    description:
      "Move tasks from pending to in progress and completed while keeping a clear history.",
  },
  {
    icon: BarChart3,
    title: "Workload Overview",
    description:
      "See assigned tasks, completed work, pending work, and estimated workload for each member.",
  },
  {
    icon: Home,
    title: "Household Dashboard",
    description:
      "Manage members, tasks, progress, calendar activity, and household information in one place.",
  },
  {
    icon: MessageSquare,
    title: "Anonymous Feedback",
    description:
      "Let household members share suggestions and concerns without exposing their identity.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your household",
    description:
      "Set up your household and create a shared space for everyone.",
  },
  {
    number: "02",
    title: "Add your members",
    description:
      "Invite family members, roommates, or other people sharing the home.",
  },
  {
    number: "03",
    title: "Create your tasks",
    description:
      "Add daily, recurring, permanent, temporary, or guest-related tasks.",
  },
  {
    number: "04",
    title: "Tasks are distributed",
    description:
      "HomeSync automatically assigns eligible tasks using fair rotation.",
  },
  {
    number: "05",
    title: "Complete with evidence",
    description:
      "Start, complete, record time, and optionally attach photo evidence.",
  },
  {
    number: "06",
    title: "Track household progress",
    description:
      "View workload, task status, calendar activity, and anonymous feedback.",
  },
];

const demoTasks = [
  {
    title: "Clean kitchen",
    status: "Completed",
    time: "24 min",
    completed: true,
  },
  {
    title: "Take out trash",
    status: "In Progress",
    time: "12 min",
    completed: false,
  },
  {
    title: "Vacuum living room",
    status: "Pending",
    time: "20 min",
    completed: false,
  },
];

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroTextRef = useRef<HTMLParagraphElement>(null);
  const heroActionsRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const featureSectionRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      heroTimeline
        .from(heroTitleRef.current, {
          y: 45,
          opacity: 0,
          duration: 0.9,
        })
        .from(
          heroTextRef.current,
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.45"
        )
        .from(
          heroActionsRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.35"
        )
        .from(
          heroVisualRef.current,
          {
            x: 70,
            opacity: 0,
            scale: 0.96,
            duration: 1,
          },
          "-=0.65"
        );

      gsap.to(".hero-floating-card", {
        y: -10,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.25,
      });

      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card) => {
        gsap.from(card, {
          y: 45,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });

      gsap.from(".features-heading", {
        y: 35,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: featureSectionRef.current,
          start: "top 75%",
        },
      });

      gsap.utils.toArray<HTMLElement>(".step-card").forEach((card, index) => {
        gsap.from(card, {
          x: index % 2 === 0 ? -35 : 35,
          opacity: 0,
          duration: 0.7,
          delay: index * 0.04,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
      });

      gsap.from(".about-content", {
        y: 45,
        opacity: 0,
        duration: 0.9,
        scrollTrigger: {
          trigger: ".about-section",
          start: "top 78%",
        },
      });

      gsap.from(".cta-section", {
        scale: 0.96,
        opacity: 0,
        duration: 0.9,
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top 82%",
        },
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <main
      ref={pageRef}
      className="min-h-screen overflow-x-hidden bg-white text-[#172033]"
    >
      {/* ================= NAVBAR ================= */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#E2E8F0]/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/landing"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6] text-white">
              <Home size={21} strokeWidth={2.2} />
            </div>

            <span className="text-xl font-bold tracking-[-0.03em]">
              HomeSync
              </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-sm font-medium text-[#172033] transition-colors hover:text-[#3B82F6]"
            >
              Home
            </a>

            <a
              href="#features"
              className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#3B82F6]"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#3B82F6]"
            >
              How It Works
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#3B82F6]"
            >
              About
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#172033] transition-colors hover:bg-[#F8FAFC] hover:text-[#3B82F6]"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2563EB] hover:shadow-lg hover:shadow-blue-500/20"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#172033] md:hidden"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#E2E8F0] bg-white px-5 py-5 md:hidden">
            <nav className="flex flex-col gap-1">
              {[
                ["Home", "#home"],
                ["Features", "#features"],
                ["How It Works", "#how-it-works"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={closeMobileMenu}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#3B82F6]"
                >
                  {label}
                </a>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-4">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-3 text-center text-sm font-semibold"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="rounded-lg bg-[#3B82F6] px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section
        id="home"
        ref={heroRef}
        className="relative overflow-hidden bg-white pt-[72px]"
      >
        <div className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-[#F1F5F9] blur-3xl" />
        <div className="absolute -left-48 bottom-0 h-[350px] w-[350px] rounded-full bg-[#F8FAFC] blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <h1
              ref={heroTitleRef}
              className="text-5xl font-bold leading-[1.04] tracking-[-0.045em] text-[#172033] sm:text-6xl lg:text-[68px]"
            >
              Share the Work.
              <br />
              <span className="text-[#3B82F6]">Balance the Home.</span>
            </h1>

            <p
              ref={heroTextRef}
              className="mt-7 max-w-xl text-base leading-7 text-[#64748B] sm:text-lg"
            >
              HomeSync makes household responsibilities easier to organize,
              distribute, and track. Create tasks, rotate recurring work,
              capture completion evidence, and keep everyone on the same page.
            </p>

            <div
              ref={heroActionsRef}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#2563EB]"
              >
                Create Your Household

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3.5 text-sm font-bold text-[#172033] transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
              >
                See How It Works
                <ChevronDown size={17} />
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#64748B]">
              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#3B82F6]" />
                Fair task rotation
              </span>

              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#3B82F6]" />
                Evidence tracking
              </span>

              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#3B82F6]" />
                Shared visibility
              </span>
            </div>
          </div>

          {/* HERO DASHBOARD */}
          <div
            ref={heroVisualRef}
            className="relative mx-auto w-full max-w-[620px]"
          >
            <div className="absolute -left-5 top-14 z-20 hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl shadow-slate-300/60 sm:block hero-floating-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                  <CheckCircle2 size={21} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#64748B]">
                    Task completed
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-[#172033]">
                    Kitchen cleaned
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 bottom-16 z-20 hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl shadow-slate-300/60 sm:block hero-floating-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#172033]">
                  <Clock3 size={19} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#64748B]">
                    Time tracked
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-[#172033]">
                    24 minutes
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#CBD5E1] bg-white shadow-2xl shadow-slate-300/70">
              <div className="flex h-14 items-center justify-between border-b border-[#E2E8F0] px-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#172033] text-white">
                    <Home size={16} />
                  </div>

                  <span className="text-sm font-bold">HomeSync</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden h-8 w-24 rounded-lg bg-[#F8FAFC] sm:block" />
                  <div className="h-8 w-8 rounded-full bg-[#DBEAFE]" />
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-5 sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-medium text-[#64748B]">
                    Household dashboard
                  </p>

                  <h3 className="mt-1 text-xl font-bold tracking-tight">
                    Good morning 👋
                  </h3>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
                    <p className="text-[11px] font-medium text-[#64748B]">
                      Members
                    </p>
                    <p className="mt-1 text-xl font-bold">4</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
                    <p className="text-[11px] font-medium text-[#64748B]">
                      My tasks
                    </p>
                    <p className="mt-1 text-xl font-bold">6</p>
                  </div>

                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">
                    <p className="text-[11px] font-medium text-[#64748B]">
                      Completed
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#3B82F6]">
                      4
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold">My Tasks</h4>
                  <span className="text-xs font-semibold text-[#3B82F6]">
                    View all
                  </span>
                </div>

                <div className="space-y-3">
                  {demoTasks.map((task) => (
                    <div
                      key={task.title}
                      className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          task.completed
                            ? "bg-[#EFF6FF] text-[#3B82F6]"
                            : "bg-[#F8FAFC] text-[#64748B]"
                        }`}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Clock3 size={18} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#172033]">
                          {task.title}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                          {task.time}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          task.status === "Completed"
                            ? "bg-[#EFF6FF] text-[#2563EB]"
                            : task.status === "In Progress"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-[#F8FAFC] text-[#64748B]"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        ref={featureSectionRef}
        className="bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="features-heading mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
              Everything in one place
            </span>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              A smarter way to manage household work
            </h2>

            <p className="mt-4 text-base leading-7 text-[#64748B]">
              HomeSync brings task assignment, rotation, completion tracking,
              workload visibility, and feedback into one shared household
              workspace.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="feature-card group rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-[#BFDBFE] hover:bg-white hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6] transition-all duration-300 group-hover:bg-[#3B82F6] group-hover:text-white">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#172033]">
                    {feature.title}
                  </h3>

                  <p className="mt-2.5 text-sm leading-6 text-[#64748B]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        ref={howItWorksRef}
        className="bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
              Simple workflow
            </span>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              How HomeSync works
            </h2>

            <p className="mt-4 text-base leading-7 text-[#64748B]">
              Set up your household once, then let HomeSync handle the
              organization of everyday responsibilities.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="step-card group relative rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:bg-white hover:shadow-lg hover:shadow-slate-200/60"
              >
                <span className="text-4xl font-black tracking-[-0.05em] text-[#CBD5E1] transition-colors duration-300 group-hover:text-[#3B82F6]">
                  {step.number}
                </span>

                <h3 className="mt-5 text-lg font-bold text-[#172033]">
                  {step.title}
                </h3>

                <p className="mt-2.5 text-sm leading-6 text-[#64748B]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section
        id="about"
        className="about-section bg-white py-24"
      >
        <div className="about-content mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
              Why HomeSync
            </span>

            <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-[-0.035em] text-[#172033] sm:text-4xl">
              Make household responsibilities visible and organized.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-[#64748B]">
              Household work can become difficult when responsibilities are
              assigned manually, tasks are forgotten, or members cannot see
              what others are handling. HomeSync creates a shared system where
              responsibilities can be assigned, rotated, completed, and
              reviewed.
            </p>

            <div className="mt-7 space-y-3">
              {[
                "Automatic task distribution",
                "Recurring task rotation",
                "Completion evidence and time tracking",
                "Anonymous household feedback",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF6FF] text-[#3B82F6]">
                    <Check size={14} strokeWidth={2.5} />
                  </span>

                  <span className="text-sm font-medium text-[#334155]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 shadow-xl shadow-slate-200/60 sm:p-8">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
                <div>
                  <p className="text-xs font-medium text-[#64748B]">
                    Household workload
                  </p>

                  <p className="mt-1 text-2xl font-bold text-[#172033]">
                    This week
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                  <BarChart3 size={21} />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {[
                  ["Member", "8 tasks", "67%"],
                  ["Member", "6 tasks", "50%"],
                  ["Member", "7 tasks", "58%"],
                  ["Member", "5 tasks", "42%"],
                ].map(([label, tasks, width], index) => (
                  <div key={`${label}-${index}`}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#334155]">
                        Household member {index + 1}
                      </span>

                      <span className="text-[#64748B]">{tasks}</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div
                        className="h-full rounded-full bg-[#3B82F6] transition-all duration-700"
                        style={{ width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta-section bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#334155] bg-[#172033] px-6 py-14 text-center shadow-2xl shadow-black/20 sm:px-10">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#334155] bg-[#202B3D] px-3.5 py-2 text-xs font-semibold text-[#93C5FD]">
              <Sparkles size={14} />
              Built for shared homes
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl">
              Bring clarity to your household responsibilities.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#94A3B8] sm:text-base">
              Create your HomeSync household and start organizing everyday
              tasks in one shared workspace.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#172033] transition-all duration-300 hover:-translate-y-1 hover:bg-[#EFF6FF]"
            >
              Get Started
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0B1120] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
          <div className="lg:col-span-2">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172033] text-white ring-1 ring-[#334155]">
                <Home size={19} />
              </span>

              <span className="text-lg font-bold">
                Home<span className="text-[#60A5FA]">Sync</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[#94A3B8]">
              A smart household task management platform designed to make
              shared responsibilities easier to organize and track.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Product</h3>

            <div className="mt-4 space-y-3 text-sm text-[#94A3B8]">
              <a
                href="#features"
                className="block transition-colors hover:text-white"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="block transition-colors hover:text-white"
              >
                How It Works
              </a>

              <Link
                href="/register"
                className="block transition-colors hover:text-white"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Company</h3>

            <div className="mt-4 space-y-3 text-sm text-[#94A3B8]">
              <a
                href="#about"
                className="block transition-colors hover:text-white"
              >
                About
              </a>

              <span className="block">Privacy</span>
              <span className="block">Terms</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1E293B]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-[#64748B] sm:px-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
            <p>© {new Date().getFullYear()} HomeSync. All rights reserved.</p>

            <p>Smart household management platform.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}