"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  LayoutDashboard, Users, Building2, Wallet, CalendarOff, Calculator,
  History, FileText, ChartNoAxesCombined, Settings, BellDot,
} from "lucide-react";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Employees", icon: Users },
  { label: "Departments", icon: Building2 },
  { label: "Salary Management", icon: Wallet },
  { label: "Absences", icon: CalendarOff },
  { label: "Payroll Processing", icon: Calculator },
  { label: "Payroll History", icon: History },
  { label: "Payslips", icon: FileText },
  { label: "Reports", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
];

/**
 * Miniature of the real HR dashboard, rebuilt with the app's tokens —
 * the Figma landing page shows the actual product inside a browser frame.
 * Static mock by design (marketing illustration, not live data).
 */
export function DashboardPreview() {
  const reduce = useReducedMotion();

  return (
    <div
      className="overflow-hidden rounded-[24px] border border-[#B5CCBE] shadow-[0px_24px_48px_0px_rgba(3,27,36,0.25)]"
    >
      {/* Browser chrome */}
      <div className="flex h-[38px] items-center gap-1.5 bg-[#D5E3D9] px-5">
        <span className="size-2 rounded-full bg-[#B5CCBE]" />
        <span className="size-2 rounded-full bg-[#B5CCBE]" />
        <span className="size-2 rounded-full bg-[#B5CCBE]" />
        <span className="mx-auto hidden rounded-full bg-[#F8F9F6]/80 px-3 py-1 text-[9px] text-[#62776E] sm:block">
          salario.app/overview
        </span>
      </div>

      <div className="flex bg-[#F8F9F6]">
        {/* Sidebar */}
        <div className="hidden w-[190px] shrink-0 flex-col justify-between bg-gradient-to-b from-[#24624F] to-[#102E29] px-3 py-5 sm:flex">
          <div>
            <div className="flex items-center gap-2 px-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/salario-logo.svg" alt="" className="h-[30px] w-[23px]" />
              <div>
                <p className="text-[15px] font-extrabold tracking-[0.6px] text-white">SALARIO</p>
                <p className="text-[6px] font-bold tracking-[1.4px] text-[#A8C9B5]">BY SOS GROUPE</p>
              </div>
            </div>
            <p className="mt-5 px-1 text-[8px] font-bold tracking-[1.3px] text-[#A8C9B5]">HR WORKSPACE</p>
            <nav className="mt-1.5 space-y-[3px]">
              {NAV.map((item) => (
                <div
                  key={item.label}
                  className={
                    item.active
                      ? "flex h-[30px] items-center gap-2 rounded-[7px] bg-[#DDE9E1] px-2 text-[10px] font-bold text-[#102E29]"
                      : "flex h-[30px] items-center gap-2 rounded-[7px] px-2 text-[10px] font-semibold text-[#D1E5D9]"
                  }
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-[#62776E]">Workspace / Overview</p>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-semibold text-[#173B32]">October 2026</span>
              <BellDot className="size-3.5 text-[#62776E]" />
              <span className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#102E29] text-[7px] font-bold text-white">HR</span>
                <span className="text-[9px] font-bold text-[#173B32]">HR team</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-extrabold tracking-tight text-[#102E29] sm:text-[21px]">Good morning, HR team.</p>
              <p className="text-[9px] text-[#62776E]">Here&apos;s your payroll overview for October 2026.</p>
            </div>
            <span className="hidden shrink-0 rounded-[8px] bg-[#398675] px-3 py-2 text-[9px] font-bold text-white sm:block">
              Open payroll ↗
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <motion.div
              initial={reduce ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-2 rounded-[14px] bg-gradient-to-r from-[#102E29] to-[#286A56] p-3.5 shadow-sm"
            >
              <p className="text-[7px] font-bold tracking-[1.4px] text-[#A8C9B5]">MONTHLY PAYROLL</p>
              <p className="text-[22px] font-extrabold tracking-tight text-white sm:text-[28px]">20,640,000</p>
              <p className="text-[8px] text-[#A8C9B5]">DZD · Projected · 232 / 248 calculated</p>
            </motion.div>
            <motion.div
              initial={reduce ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-1 rounded-[14px] bg-[#E7EFE9] p-3.5"
            >
              <p className="text-[8px] font-semibold text-[#173B32]">Total Employees</p>
              <p className="text-[24px] font-extrabold tracking-tight text-[#102E29]">248</p>
              <p className="text-[8px] text-[#62776E]">5 departments · All active</p>
            </motion.div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-2 rounded-[12px] border border-[#DEE6DF] bg-white p-3.5 shadow-[0px_8px_24px_0px_rgba(23,63,53,0.04)]">
              <p className="text-[10px] font-bold text-[#183B33]">Monthly payroll trends</p>
              <p className="text-[7px] text-[#74827B]">Net payroll · DZD millions</p>
              <svg viewBox="0 0 300 70" className="w-full" aria-hidden>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#398675" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#398675" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 52 C40 50 60 44 95 46 C130 48 150 36 185 33 C220 30 245 24 300 14 L300 70 L0 70 Z" fill="url(#areaFill)" />
                <motion.path
                  d="M0 52 C40 50 60 44 95 46 C130 48 150 36 185 33 C220 30 245 24 300 14"
                  fill="none"
                  stroke="#398675"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex justify-between text-[7px] text-[#74827B]">
                {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                  <span key={m} className={m === "Oct" ? "font-bold text-[#398675]" : undefined}>{m}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-[12px] bg-[#E7EFE9] p-3.5">
              <p className="text-[11px] font-extrabold text-[#102E29]">Payroll Processed</p>
              <p className="text-[24px] font-extrabold text-[#102E29]">94%</p>
              <div className="h-1.5 rounded-full bg-[#D5E3D9]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#17584F] to-[#5EAA7C]"
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.35 }}
                />
              </div>
              <p className="font-mono text-[7px] text-[#62776E]">232 / 248 calculated · 16 remaining</p>
              <span className="w-fit rounded-full bg-[rgba(246,201,104,0.48)] px-2 py-0.5 text-[8px] font-semibold text-[#F1AE2C]">
                ● In progress
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-[7px] text-[#74827B]">
            <span>4 pending HR tasks</span>
            <span>Calculation in progress · not paid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
