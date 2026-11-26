import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F7F4] p-8 text-center">
      <p className="text-[11px] font-bold tracking-[1.7px] text-[#398675]">403 · RESTRICTED</p>
      <h1 className="text-3xl font-extrabold text-[#102E29]">You don&apos;t have access to this module.</h1>
      <p className="max-w-md text-[14px] text-[#596760]">
        Your role doesn&apos;t include this permission. Contact the HR operator if you need access.
      </p>
      <Link href="/login"><Button>Back to login</Button></Link>
    </div>
  );
}
