import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

type ShellProps = {
  children: ReactNode;
};

export const Shell = ({ children }: ShellProps) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  </div>
);
