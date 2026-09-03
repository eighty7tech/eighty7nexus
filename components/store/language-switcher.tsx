"use client";

import { useLanguage, swapLocaleInPathname } from "@/providers/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlagIcon } from "@/components/ui/flag-icon";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher({ className, detectedCountry }: { className?: string; detectedCountry?: string }) {
  const { language, languages } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (nextLocale: string) => {
    startTransition(() => {
      const nextUrl = swapLocaleInPathname(pathname, language.code, nextLocale);
      router.push(nextUrl);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("flex items-center gap-2 px-2 h-8", className)}>
          <FlagIcon countryCode={detectedCountry || language.countryCode} size={20} round />
          <span className="font-medium text-sm uppercase">{language.code}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleLanguageChange(l.code)}
          >
            <FlagIcon countryCode={l.countryCode} size={20} round />
            <span className="font-medium">{l.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
