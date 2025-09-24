import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const routes = [
  { label: "Home", to: "/" },
  { label: "Plans", to: "/plans" },
  { label: "Properties", to: "/properties" },
  { label: "Account Dashboard", to: "/account" },
  { label: "Requests", to: "/account/requests" },
  { label: "Quotes", to: "/account/quotes" },
  { label: "Projects", to: "/account/projects" },
  { label: "Messages", to: "/account/messages" },
  { label: "Appointments", to: "/account/appointments" },
  { label: "Profile", to: "/account/profile" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Go to… (Ctrl/Cmd+K)" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {routes.map((r) => (
            <CommandItem key={r.to} onSelect={() => go(r.to)}>
              {r.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

