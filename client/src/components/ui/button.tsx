import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  href?: string;
  children: React.ReactNode;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  href,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
    {
      "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
      "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
      "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground": variant === "outline",
      "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
      "underline-offset-4 hover:underline text-primary": variant === "link",
      "h-10 py-2 px-4 text-sm": size === "default",
      "h-9 px-3 rounded-md text-xs": size === "sm",
      "h-11 px-8 rounded-md text-base": size === "lg",
    },
    className
  );

  if (href) {
    return (
      <a href={href} className={baseStyles}>
        {children}
      </a>
    );
  }

  return (
    <button className={baseStyles} {...props}>
      {children}
    </button>
  );
}