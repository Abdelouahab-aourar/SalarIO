import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "SALARIO — People first, precision in every pay",
  description:
    "One connected HR workspace for people, salaries, absences, payroll approval, payslips and reports. Enterprise payroll by SOS Groupe.",
};

export default function MarketingHomePage() {
  return <LandingPage />;
}
