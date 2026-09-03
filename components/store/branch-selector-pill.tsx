"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStoreMode } from "@/hooks/use-store-mode";
import { useLanguage } from "@/providers/language-provider";
import { MapPin, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BranchSelectorPill() {
  const router = useRouter();
  const { language } = useLanguage();
  const { branchId, setBranch, initFromCookies } = useStoreMode();
  const [branches, setBranches] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initFromCookies();
    setMounted(true);
    
    // Fetch active branches
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setBranches(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to load branches:", error);
      }
    };
    
    fetchBranches();
  }, [initFromCookies]);

  if (!mounted) return <div className="h-8 w-24 bg-muted/50 rounded-full animate-pulse" />;

  const selectedBranch = branches.find((b) => b._id === branchId);

  const handleBranchSelect = (branch: any | null) => {
    setBranch(branch ? branch._id : null);
    
    if (branch) {
      router.push(`/${language.code}/branch/${branch.slug}`);
    } else {
      router.push(`/${language.code}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 transition-colors rounded-full border border-border/50 text-xs font-medium text-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="max-w-[120px] truncate">
            {selectedBranch ? selectedBranch.name : "All Branches"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem 
          onClick={() => handleBranchSelect(null)}
          className={!branchId ? "font-bold" : ""}
        >
          All Branches (Global)
        </DropdownMenuItem>
        {branches.map((branch) => (
          <DropdownMenuItem 
            key={branch._id} 
            onClick={() => handleBranchSelect(branch)}
            className={branchId === branch._id ? "font-bold bg-primary/5 text-primary" : ""}
          >
            {branch.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
