"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, Plus } from "lucide-react";
import { Button, Input, Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function Header({ title, description, action }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-lg border-b-2 border-[var(--color-border)]">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Tittel */}
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--color-muted)]">{description}</p>
          )}
        </div>

        {/* Høyre side */}
        <div className="flex items-center gap-4">
          {/* Søk */}
          <div className="hidden md:block w-64">
            <Input
              placeholder="Søk..."
              icon={<Search className="h-4 w-4" />}
              className="h-9"
            />
          </div>

          {/* Action-knapp */}
          {action && (
            <Button onClick={action.onClick} size="sm">
              <Plus className="h-4 w-4" />
              {action.label}
            </Button>
          )}

          {/* Varsler */}
          <button className="relative p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-input)] hover:text-[var(--color-foreground)] transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-error)] rounded-full" />
          </button>

          {/* Bruker */}
          <div className="md:hidden">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(session?.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}

