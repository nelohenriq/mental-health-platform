"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Home,
  Settings,
  MessageCircle,
  TrendingUp,
  Brain,
  User,
  Shield,
} from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/", icon: Home },
  ];

  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    let icon: React.ComponentType<{ className?: string }> | undefined;

    // Customize labels and icons based on routes
    switch (segment) {
      case "dashboard":
        label = "Dashboard";
        break;
      case "mood":
        if (segments[i + 1] === "log") {
          continue; // Skip 'mood' if next is 'log'
        }
        label = "Mood Tracking";
        icon = TrendingUp;
        break;
      case "log":
        label = "Log Mood";
        break;
      case "conversations":
        label = "AI Conversations";
        icon = MessageCircle;
        break;
      case "cbt":
        label = "CBT Exercises";
        icon = Brain;
        break;
      case "profile":
        label = "Profile";
        icon = User;
        break;
      case "settings":
        label = "Settings";
        icon = Settings;
        break;
      case "admin":
        label = "Admin";
        icon = Shield;
        if (segments[i + 1]) {
          switch (segments[i + 1]) {
            case "cbt":
              breadcrumbs.push({
                label: "CBT Management",
                href: currentPath,
                icon: Brain,
              });
              return breadcrumbs;
            case "analytics":
              breadcrumbs.push({
                label: "Analytics",
                href: currentPath,
                icon: TrendingUp,
              });
              return breadcrumbs;
            case "crisis":
              breadcrumbs.push({
                label: "Crisis Management",
                href: currentPath,
                icon: Shield,
              });
              return breadcrumbs;
          }
        }
        break;
      case "auth":
        if (segments[i + 1] === "login") {
          breadcrumbs.push({
            label: "Sign In",
            href: currentPath,
          });
          return breadcrumbs;
        } else if (segments[i + 1] === "register") {
          breadcrumbs.push({
            label: "Sign Up",
            href: currentPath,
          });
          return breadcrumbs;
        }
        break;
      case "achievements":
        label = "Achievements";
        break;
    }

    if (icon) {
      breadcrumbs.push({ label, href: currentPath, icon });
    } else {
      breadcrumbs.push({ label, href: currentPath });
    }
  }

  return breadcrumbs;
};

export default function BreadcrumbNav() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href || crumb.label}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {crumb.icon && <crumb.icon className="h-4 w-4" />}
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={crumb.href!}
                        className="flex items-center gap-2"
                      >
                        {crumb.icon && <crumb.icon className="h-4 w-4" />}
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </nav>
  );
}
