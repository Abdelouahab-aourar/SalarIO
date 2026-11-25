"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, ArrowUpRight, Check, LockKeyhole, ShieldCheck, ScanEye,
  Users, Wallet, Calculator, Files, CircleCheck, FileText, History,
  ChartNoAxesCombined,
} from "lucide-react";
import { Logo } from "./logo";
import { Faq } from "./faq";
import { DashboardPreview } from "./dashboard-preview";
import {
  Reveal, RevealGroup, RevealItem, Lift, Floating, SmartImage,
} from "./motion-primitives";

const MODULES = [
  { label: "People & departments", icon: Users, src: "/landing/icon-users.svg" },
  { label: "Salaries & absences", icon: Wallet, src: "/landing/icon-wallet.svg" },
  { label: "Payroll processing", icon: Calculator, src: "/landing/icon-calculator.svg" },
  { label: "Payslips & reports", icon: Files, src: "/landing/icon-files.svg" },
];

const PRINCIPLES = [
  "A complete view of your people",
  "Transparent payroll calculations",
  "A clear next step, every month",
];

const DEPARTMENTS = [
  { name: "Operations", staff: 92, color: "#173F35" },
  { name: "Engineering", staff: 64, color: "#398675" },
  { name: "Sales", staff: 40, color: "#7AAA94" },
  { name: "Finance", staff: 28, color: "#A8C9B5" },
  { name: "HR & Administration", staff: 24, color: "#D5B77A" },
];

const DIRECTORY = [
  { initials: "AB", name: "Amine Benali", dept: "Operations", salary: "95,000", status: "Active" },
  { initials: "LB", name: "Lina Boudiaf", dept: "Engineering", salary: "120,000", status: "Active" },
  { initials: "YM", name: "Yacine Meziane", dept: "Sales", salary: "90,000", status: "Active" },
];

const MOVES = [
  {
    step: "01",
    title: "Organize",
    body: "Keep employee records, departments, salaries and absence entries ready for the period.",
    foot: "A connected foundation",
    art: null,
  },
  {
    step: "02",
    title: "Calculate",
    body: "Bring base salaries, bonuses and deductions together. Track every remaining calculation.",
    foot: "232 / 248 calculated · October 2026",
    art: "/landing/asset-salary-calculation.png",
  },
  {
    step: "03",
    title: "Review & export",
    body: "Review period totals, prepare payslips and export the reports your HR team needs.",
    foot: "A clear record of every period",
    art: "/landing/asset-reporting-bars.png",
  },
];

const FAQ_ITEMS = [
  {
    question: "Who is SALARIO for?",
    answer:
      "SALARIO is an enterprise payroll workspace for HR teams running payroll across multiple departments: one HR operator administers people, rules and payroll; authorized users enter absences and bonuses for their departments; an approver signs off monthly payroll; employees view their own payslips.",
  },
  {
    question: "What goes into a payroll calculation?",
    answer:
      "Base salary, experience (IEP), overtime, taxable bonuses and non-taxable allowances are combined with absence-related deductions, then employee social contributions (CNAS 9%) and income tax (IRG) produce the net. Every line is shown in a transparent breakdown you can audit.",
  },
  {
    question: "Does \u201ccalculated\u201d mean the payroll is paid?",
    answer:
      "No. Calculation progress is separate from payment and approval. A payroll moves through In review, Pending, and then Approved or Rejected. Only approved payrolls become immutable history and generate payslips. Amounts remain labelled projected until approval.",
  },
  {
    question: "Can I organize employees by department?",
    answer:
      "Yes. Every employee belongs to exactly one department, and departments can carry their own salary rules with effective dates. Search and filter the directory to find the people you need.",
  },
  {
    question: "What happens after I review payroll?",
    answer:
      "HR submits the reviewed payroll to the approver. The approver approves it — locking an immutable snapshot and generating payslips — or rejects it with a reason so HR can correct and resubmit. Past approved periods never change when new rules are introduced.",
  },
  {
    question: "How do accounts get created?",
    answer:
      "There is no public self-registration. Your HR administrator provisions accounts and assigns access: HR, authorized user, approver, or employee. Employees only ever see their own payslips.",
  },
];

export function LandingPage() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9F6] text-[#26332F]">
      {/* ================= HERO ================= */}
      <div
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ backgroundImage: "linear-gradient(147deg, #0B241E 12%, #24624F 77%, rgba(116,187,130,0.9) 118%)" }}
      >
        <header
          className={`sticky top-0 z-40 transition-all duration-300 ${
            scrolled ? "border-b border-white/10 bg-[#0B241E]/85 backdrop-blur-md" : "border-b border-transparent"
          }`}
        >
          <div className="mx-auto flex h-[88px] w-full max-w-[1440px] items-center justify-between gap-3 px-5 sm:px-10 lg:px-20">
            <Logo href="/" subtitle="BY SOS GROUPE" size="sm" />
            <nav className="hidden items-center gap-[30px] text-[13px] font-medium text-[#E7EFE9] lg:flex">
              <a href="#product" className="transition-opacity hover:opacity-70">Product</a>
              <a href="#why" className="transition-opacity hover:opacity-70">Why SALARIO</a>
              <a href="#security" className="transition-opacity hover:opacity-70">Security</a>
              <a href="#faq" className="transition-opacity hover:opacity-70">FAQ</a>
            </nav>
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <Link href="/login" className="whitespace-nowrap text-[12px] font-semibold text-[#F8F9F6] transition-opacity hover:opacity-70 sm:text-[13px]">
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[20px] bg-[#A6D986] px-4 text-[12px] font-bold text-[#102E29] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 sm:h-[44px] sm:px-5 sm:text-[14px]"
              >
                HR sign in ↗
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[640px] w-full max-w-[1440px] flex-col justify-center gap-10 px-6 py-[58px] sm:px-10 lg:flex-row lg:items-center lg:px-20">
          <div className="relative z-10 w-full max-w-[565px]">
            <motion.h1
              initial={reduce ? false : { y: 26 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(44px,7vw,86px)] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#F8F9F6] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]"
            >
              People first<br />Precision<br />in every pay
            </motion.h1>
            <motion.p
              initial={reduce ? false : { y: 18 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-[520px] text-[18px] leading-[1.65] text-[#A8C9B5]"
            >
              Bring people, salaries and monthly payroll into one beautifully clear HR workspace.
            </motion.p>
            <motion.div
              initial={reduce ? false : { y: 18 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/login"
                className="group inline-flex h-[54px] items-center justify-center gap-2 rounded-[20px] bg-[#173B35] px-6 text-[14px] font-bold text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#24564B]"
              >
                Sign in to your workspace
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#product"
                className="inline-flex h-[54px] items-center justify-center rounded-[20px] border border-[rgba(217,242,227,0.27)] bg-[rgba(231,239,233,0.11)] px-[18px] text-[13px] font-semibold text-[#F8F9F6] backdrop-blur-[4px] transition-colors hover:bg-white/20"
              >
                Explore SALARIO
              </a>
            </motion.div>
            <motion.p
              initial={reduce ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-4 flex items-center gap-2 text-[11px] text-[#A8C9B5]"
            >
              <LockKeyhole className="size-3.5" />
              Accounts are provisioned by your HR administrator.
            </motion.p>
          </div>

          <motion.div style={{ y: heroY }} className="relative w-full max-w-[620px] flex-1 lg:max-w-none">
            <Floating amplitude={12} className="relative">
              <SmartImage
                src="/landing/hero-payroll-balance.png"
                alt="3D illustration of a calendar, wallet and payslip in balance"
                priority
                className="aspect-square w-full"
                imgClassName="h-full w-full object-contain drop-shadow-[0_40px_80px_rgba(3,27,36,0.45)]"
              />
            </Floating>
            <div aria-hidden className="pointer-events-none absolute inset-x-10 bottom-2 h-24 rounded-full bg-black/25 blur-3xl" />
          </motion.div>
        </div>

        {/* Product scope band */}
        <div className="border-t border-[rgba(168,201,181,0.17)]">
          <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-6 py-7 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-20">
            {MODULES.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt="" width={22} height={22} className="size-[22px]" />
                <span className="text-[14px] font-medium text-[#F8F9F6]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PRODUCT OVERVIEW ================= */}
      <section
        id="product"
        className="scroll-mt-24 bg-gradient-to-b from-[rgba(95,172,127,0.44)] to-[rgba(255,255,255,0.37)]"
      >
        <div className="mx-auto w-full max-w-[1440px] px-6 py-[88px] sm:px-10 lg:px-20">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              <h2 className="max-w-[700px] text-[clamp(34px,4.4vw,48px)] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#102E29]">
                Your month-end.<br />Without the blind spots.
              </h2>
              <div className="max-w-[410px] space-y-4">
                <p className="text-[16px] leading-[1.6] text-[#62776E]">
                  From your first employee record to the last payroll calculation, see what matters — and what still needs your attention.
                </p>
                <Link href="/login" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#398675] hover:underline">
                  Explore the HR workspace <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <DashboardPreview />
          </Reveal>

          <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-3" stagger={0.1}>
            {PRINCIPLES.map((label) => (
              <RevealItem key={label}>
                <div className="flex items-center gap-2.5">
                  <CircleCheck className="size-[18px] shrink-0 text-[#398675]" />
                  <span className="text-[13px] font-semibold text-[#173B32]">{label}</span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ================= PEOPLE STORY ================= */}
      <section
        id="why"
        className="scroll-mt-24"
        style={{ backgroundImage: "linear-gradient(179deg, #F8F9F6 40%, #1E6054 226%)" }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-12 px-6 py-[88px] sm:px-10 lg:flex-row lg:gap-[76px] lg:px-20">
          <Reveal className="w-full max-w-[450px] shrink-0">
            <h2 className="text-[clamp(34px,4.5vw,49px)] font-extrabold leading-[1.12] tracking-[-0.042em] text-[#102E29]">
              Great payroll<br />starts with<br />your people.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-[#62776E]">
              Keep employee records, positions, employment types and base salaries together. Organize by department without losing sight of the individual.
            </p>
            <div className="mt-6 space-y-3.5">
              {["A searchable employee directory", "Clear department organization", "Salary details, ready for the next period"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-[#D5E6DE]">
                    <Check className="size-3 text-[#173B35]" strokeWidth={3} />
                  </span>
                  <span className="text-[13px] font-semibold text-[#173B32]">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-[#398675] hover:underline">
              Meet your employee workspace <ArrowUpRight className="size-3.5" />
            </Link>
          </Reveal>

          <Reveal delay={0.12} className="w-full flex-1">
            <div className="rounded-[24px] bg-[#E7EFE9] p-6 shadow-[0px_2px_2px_0px_rgba(0,0,0,0.25)] backdrop-blur-[5px] sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-[#62776E]">/ Employees</p>
                  <p className="text-[clamp(20px,2.4vw,25px)] font-extrabold tracking-[-0.04em] text-[#102E29]">248 people. One source.</p>
                </div>
                <Users className="size-[30px] shrink-0 text-[#173F35]" />
              </div>

              <div className="mt-5 overflow-hidden rounded-[10px] border border-[#DEE6DF]">
                <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] bg-[rgba(64,146,116,0.29)] px-3.5 py-2 text-[9px] font-bold uppercase tracking-wide text-black/70">
                  <span>Employee</span><span>Department</span><span>Base salary · DZD</span><span>Status</span>
                </div>
                {DIRECTORY.map((row, i) => (
                  <motion.div
                    key={row.name}
                    initial={reduce ? false : { x: -8 }}
                    whileInView={{ x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
                    className={`grid grid-cols-[1.6fr_1fr_1fr_0.8fr] items-center border-b border-[#DEE6DF] px-3.5 py-2.5 text-[10px] last:border-b-0 ${i % 2 === 1 ? "bg-[#E7EFE9]" : "bg-white"}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="flex size-[27px] shrink-0 items-center justify-center rounded-full bg-[#E7EFE9] text-[9px] font-bold text-[#183B33]">{row.initials}</span>
                      <span className="truncate font-semibold text-[#183B33]">{row.name}</span>
                    </span>
                    <span className="truncate text-[#74827B]">{row.dept}</span>
                    <span className="font-semibold text-[#183B33]">{row.salary}</span>
                    <span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${row.status === "Active" ? "bg-[#E7EFE9] text-[#398675]" : "bg-[rgba(231,201,140,0.29)] text-[#D5B77A]"}`}>
                        <span className={`size-[5px] rounded-full ${row.status === "Active" ? "bg-[#398675]" : "bg-[#D5B77A]"}`} />
                        {row.status}
                      </span>
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-[10px] font-bold tracking-[1px] text-[#398675]">5 CONNECTED DEPARTMENTS</p>
                {DEPARTMENTS.map((d, i) => (
                  <motion.div
                    key={d.name}
                    initial={reduce ? false : { y: 8 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                    className="flex items-center gap-3 rounded-[9px] bg-white px-3.5 py-2.5"
                  >
                    <span className="size-[7px] rounded-[2px]" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 text-[12px] font-medium text-[#173B32]">{d.name}</span>
                    <span className="text-[11px] text-[#62776E]">{d.staff} employees</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= NUMBERS BAND ================= */}
      <section className="relative overflow-hidden bg-[#173B35]">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-6 py-[88px] sm:px-10 lg:grid-cols-[minmax(0,540px)_1fr] lg:gap-20 lg:px-20">
          <Reveal>
            <div className="relative">
              <Floating amplitude={8} className="pointer-events-none absolute -top-16 left-4 w-40 opacity-90 sm:w-52">
                <SmartImage src="/landing/connected-employees.png" alt="" className="aspect-square w-full" imgClassName="h-full w-full object-contain"  priority/>
              </Floating>
              <div className="relative rounded-[20px] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-md">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-[1.4px]">
                  <span className="text-[#A8C9B5]">OCTOBER 2026</span>
                  <span className="text-[#D5B77A]">PROJECTED · DZD</span>
                </div>
                <div className="mt-5 space-y-3 text-[13px]">
                  <div className="flex justify-between text-[#E7EFE9]"><span>Base salaries</span><span className="font-mono">19,840,000</span></div>
                  <div className="flex justify-between text-[#E7EFE9]"><span>+ Bonuses</span><span className="font-mono">1,260,000</span></div>
                  <div className="flex justify-between text-[#E7EFE9]"><span>− Absences / deductions</span><span className="font-mono">460,000</span></div>
                </div>
                <div className="mt-5 border-t border-white/15 pt-4">
                  <p className="text-[10px] font-bold tracking-[1.4px] text-[#A8C9B5]">NET PROJECTED</p>
                  <p className="mt-1 font-mono text-[clamp(30px,4vw,40px)] font-semibold text-white">
                    20,640,000
                  </p>
                  <p className="mt-1 text-[11px] text-[#A8C9B5]">Calculation incomplete · 248 employees</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="text-[clamp(34px,4.4vw,48px)] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#F8F9F6]">
              The numbers<br />behind the number.
            </h2>
            <p className="mt-5 max-w-[430px] text-[15px] leading-[1.7] text-[#A8C9B5]">
              Base salaries, bonuses and absence deductions belong in the same conversation. SALARIO brings them into one transparent monthly calculation.
            </p>
            <div className="mt-6 space-y-3">
              {["Manage salaries and bonuses", "Reflect absence-related deductions", "See a clear projected net payroll"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#A6D986]" strokeWidth={3} />
                  <span className="text-[13px] font-semibold text-[#E7EFE9]">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-[#A6D986] hover:underline">
              Understand your payroll inputs <ArrowUpRight className="size-3.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= THREE MOVES ================= */}
      <section className="bg-gradient-to-b from-[#EAF2EB] to-[#F8F9F6]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-[88px] sm:px-10 lg:px-20">
          <Reveal>
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <h2 className="max-w-[620px] text-[clamp(34px,4.4vw,48px)] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#102E29]">
                From people to payroll.<br />In three clear moves.
              </h2>
              <p className="max-w-[240px] text-[13px] leading-[1.6] text-[#62776E]">
                Built around the way HR works. No extra roles. No approval loops.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="mt-9 grid gap-4 lg:grid-cols-3" stagger={0.12}>
            {MOVES.map((move) => (
              <RevealItem key={move.step}>
                <Lift>
                  <div className="relative flex h-full min-h-[230px] flex-col overflow-hidden rounded-[18px] border border-[#CFE0D6] bg-[#DFEBE4]/70 p-6">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold tracking-wide text-[#398675]">{move.step}</span>
                      {move.art ? (
                        <SmartImage src={move.art} alt="" priority className="h-16 w-16 -mt-2 -mr-2" imgClassName="h-full w-full object-contain" />
                      ) : (
                        <Users className="size-7 text-[#173B32]" />
                      )}
                    </div>
                    <h3 className="mt-3 text-[21px] font-extrabold tracking-tight text-[#102E29]">{move.title}</h3>
                    <p className="mt-2 text-[13px] leading-[1.6] text-[#596760]">{move.body}</p>
                    <p className="mt-auto pt-5 text-[10px] text-[#74827B]">{move.foot}</p>
                  </div>
                </Lift>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ================= PAYSLIP RECORD ================= */}
      <section className="bg-gradient-to-b from-[#F8F9F6] to-[#E7F0E9]">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-6 py-[88px] sm:px-10 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-16 lg:px-20">
          <Reveal>
            <div className="relative">
              <Floating amplitude={6}>
                <SmartImage
                  src="/landing/floating-payslip.png"
                  alt="3D illustration of a payslip record card"
                  className="aspect-[4/3] w-full"
                  imgClassName="h-full w-full object-contain drop-shadow-[0_30px_60px_rgba(3,27,36,0.25)]"
                 priority/>
              </Floating>
              <motion.div
                initial={reduce ? false : { y: 12 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -bottom-2 left-2 hidden items-center gap-2 rounded-[10px] bg-[#102E29] px-3.5 py-2.5 text-white shadow-lg sm:flex"
              >
                <FileText className="size-4 text-[#A6D986]" />
                <div>
                  <p className="text-[10px] font-bold">From review to reporting</p>
                  <p className="text-[8px] text-[#A8C9B5]">Payslips · Payroll history · Reports</p>
                </div>
              </motion.div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="text-[clamp(34px,4.4vw,48px)] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#102E29]">
              A clear month-end.<br />A useful record.
            </h2>
            <p className="mt-5 max-w-[440px] text-[15px] leading-[1.7] text-[#596760]">
              Keep the story behind each period close at hand. Prepare individual payslips, revisit payroll history and bring monthly reporting into the same HR workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { label: "Payslips", icon: FileText },
                { label: "History", icon: History },
                { label: "Reports", icon: ChartNoAxesCombined },
              ].map((tag) => (
                <span key={tag.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE0D6] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#173B32]">
                  <tag.icon className="size-3.5 text-[#398675]" />
                  {tag.label}
                </span>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {["Approved periods freeze into immutable records", "Payslips only from approved payroll", "PDF and Excel exports ready for review"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <Check className="size-4 text-[#398675]" strokeWidth={3} />
                  <span className="text-[13px] font-semibold text-[#173B32]">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-[#398675] hover:underline">
              Explore payroll records <ArrowUpRight className="size-3.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= SECURITY ================= */}
      <section id="security" className="scroll-mt-24 bg-[#132F2A]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-[88px] sm:px-10 lg:px-20">
          <Reveal>
            <h2 className="max-w-[720px] text-[clamp(32px,4.2vw,46px)] font-extrabold leading-[1.15] tracking-[-0.035em] text-[#F8F9F6]">
              People data deserves<br />a thoughtful workspace.
            </h2>
            <p className="mt-5 max-w-[520px] text-[14px] leading-[1.7] text-[#A8C9B5]">
              Payroll is personal. Keep access intentional, calculations understandable and sensitive details in the hands of your HR team.
            </p>
          </Reveal>

          <RevealGroup className="mt-12 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3" stagger={0.1}>
            {[
              { icon: ShieldCheck, title: "Accountable HR roles", body: "Four roles with explicit server-side permissions. Three named roles manage payroll; employees only see their own payslips." },
              { icon: ScanEye, title: "Transparent by default", body: "Projected totals stay visibly projected while calculations are incomplete. Every net amount carries a line-by-line breakdown." },
              { icon: LockKeyhole, title: "Careful with every detail", body: "Approved payroll becomes immutable history. Sensitive actions are validated server-side and recorded in an audit log." },
            ].map((item) => (
              <RevealItem key={item.title}>
                <item.icon className="size-6 text-[#A8C9B5]" strokeWidth={1.6} />
                <h3 className="mt-4 text-[15px] font-semibold text-[#F8F9F6]">{item.title}</h3>
                <p className="mt-2 text-[12.5px] leading-[1.7] text-[#A8C9B5]">{item.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="scroll-mt-24 bg-[#F8F9F6]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-[88px] sm:px-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20 lg:px-20">
          <Reveal>
            <h2 className="text-[clamp(32px,4.2vw,46px)] font-extrabold leading-[1.15] tracking-[-0.035em] text-[#102E29]">
              Good questions.<br />Clear answers.
            </h2>
            <p className="mt-5 text-[14px] leading-[1.7] text-[#62776E]">
              A closer look at the workspace, the numbers and the way SALARIO works.
            </p>
            <p className="mt-5 text-[12px] font-bold text-[#398675]">Built for HR. Thoughtfully.</p>
            <Floating amplitude={7} className="mt-10 hidden w-[260px] lg:block">
              <SmartImage src="/landing/artwork-faq.png" alt="" className="aspect-square w-full" imgClassName="h-full w-full object-contain"  priority/>
            </Floating>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq items={FAQ_ITEMS} />
          </Reveal>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="bg-gradient-to-br from-[#E7F0E9] via-[#DCEBE0] to-[#B9D8C2]">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-6 py-[80px] sm:px-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:px-20">
          <Reveal>
            <h2 className="text-[clamp(34px,4.6vw,50px)] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#102E29]">
              Make room for<br />a clearer payroll.
            </h2>
            <p className="mt-5 max-w-[430px] text-[14px] leading-[1.7] text-[#596760]">
              One connected HR workspace. Start with your people. Bring every detail into focus — with accounts provisioned securely by your HR administrator.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex h-[48px] items-center gap-2 rounded-[16px] bg-[#173B35] px-5 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#24564B]"
              >
                Sign in to SALARIO
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-[48px] items-center gap-2 rounded-[16px] border border-[#B5CCBE] bg-white px-5 text-[13px] font-semibold text-[#173B32] transition-colors hover:bg-[#F8F9F6]"
              >
                Sign in <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Floating amplitude={8}>
              <SmartImage
                src="/landing/asset-payroll-archive.png"
                alt="3D illustration of a filing archive representing payroll history"
                className="aspect-square w-full max-w-[460px] lg:ml-auto"
                imgClassName="h-full w-full object-contain drop-shadow-[0_30px_60px_rgba(3,27,36,0.22)]"
               priority/>
            </Floating>
          </Reveal>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#102E29]">
        <div className="mx-auto w-full max-w-[1440px] px-6 pb-8 pt-14 sm:px-10 lg:px-20">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo href="/" />
              <p className="mt-4 max-w-[240px] text-[12px] leading-[1.7] text-[#A8C9B5]">
                Enterprise payroll, handled with precision.
              </p>
            </div>
            {[
              { title: "PRODUCT", links: [
                { label: "Employees & departments", href: "#why" },
                { label: "Salary & absence management", href: "#product" },
                { label: "Payroll processing", href: "#product" },
                { label: "Payslips, history & reports", href: "#product" },
              ] },
              { title: "EXPLORE", links: [
                { label: "Why SALARIO", href: "#why" },
                { label: "Data & privacy principles", href: "#security" },
                { label: "Frequently asked questions", href: "#faq" },
              ] },
              { title: "YOUR WORKSPACE", links: [
                { label: "Sign in", href: "/login" },
                { label: "Account provisioning", href: "#faq" },
              ] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-[10px] font-bold tracking-[1.4px] text-[#A8C9B5]">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-[12px] text-[#E7EFE9]/85 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[10px] text-[#7FA393] sm:flex-row sm:items-center">
            <span>© 2026 SALARIO.</span>
            <span>Illustrative October 2026 data. All amounts in DZD.</span>
            <span className="flex gap-4"><span>Terms of use</span><span>Privacy policy</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
