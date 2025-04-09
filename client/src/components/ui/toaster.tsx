import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col items-end p-4 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
    action?: React.ReactNode;
  };
  onDismiss: () => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Auto dismiss
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 text-black dark:text-white shadow-lg rounded-lg w-full max-w-sm p-4 transition-all transform duration-300",
        {
          "translate-x-0 opacity-100": isVisible,
          "translate-x-full opacity-0": !isVisible,
          "bg-red-50 dark:bg-red-900 border-l-4 border-red-600":
            toast.variant === "destructive",
        }
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          {toast.title && (
            <h3 className="font-medium text-sm">
              {toast.title}
            </h3>
          )}
          {toast.description && (
            <div className="text-sm opacity-90 mt-1">{toast.description}</div>
          )}
        </div>
        <button
          className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
        >
          <X size={16} />
        </button>
      </div>
      {toast.action && <div className="mt-2">{toast.action}</div>}
    </div>
  );
}