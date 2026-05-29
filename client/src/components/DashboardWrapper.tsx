import { ReactNode } from "react";
import { DashboardNav } from "./DashboardNav";

interface DashboardWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardWrapper({ children, title, description }: DashboardWrapperProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardNav />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
