import { useEffect } from "react";
import { toast } from "@/components/ui/sonner";

type BuildRequestEvent = {
  id: string;
  plan: { name: string; slug: string; style: string };
  region: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  submitted_at: string;
  status: string;
};

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

function toWebSocketUrl(base: string) {
  if (base.startsWith("https")) return base.replace("https", "wss");
  if (base.startsWith("http")) return base.replace("http", "ws");
  return `ws://${base.replace(/^\/+/, "")}`;
}

export function useBuildRequestFeed(onMessage?: (event: BuildRequestEvent) => void) {
  useEffect(() => {
    // TODO: Implement WebSocket endpoint in backend
    // For now, disable WebSocket to prevent 404 errors
    console.log('WebSocket feed disabled - endpoint not implemented yet');
    
    // Uncomment when backend WebSocket is ready:
    // const wsUrl = `${toWebSocketUrl(API_BASE)}/ws/admin/build-requests/`;
    // const socket = new WebSocket(wsUrl);

    // socket.onmessage = (event) => {
    //   try {
    //     const payload = JSON.parse(event.data) as BuildRequestEvent;
    //     toast("New build request", {
    //       description: `${payload.contact_name} • ${payload.plan.name} (${payload.region})`,
    //     });
    //     onMessage?.(payload);
    //   } catch (error) {
    //     console.error("Failed to parse build request event", error);
    //   }
    // };

    // socket.onerror = (error) => {
    //   console.error("Build request feed error", error);
    // };

    // return () => {
    //   socket.close();
    // };
  }, [onMessage]);
}
