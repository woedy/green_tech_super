import type { Notification } from "@/components/dashboard/NotificationCenter";
import type { ActivityItem } from "@/components/dashboard/ActivityFeed";

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "success",
    title: "Quote Received",
    message: "You have received a new quote for your Urban Duplex A2 construction request.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
    actionUrl: "/account/quotes/1",
    actionLabel: "View Quote",
  },
  {
    id: "notif-2",
    type: "info",
    title: "Milestone Completed",
    message: "Foundation pour milestone has been completed for your project in Lagos.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    actionUrl: "/account/projects/88",
    actionLabel: "View Project",
  },
  {
    id: "notif-3",
    type: "warning",
    title: "Payment Due Soon",
    message: "Your next payment of GHS 15,000 is due in 3 days.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: true,
    actionUrl: "/account/payments",
    actionLabel: "Make Payment",
  },
  {
    id: "notif-4",
    type: "info",
    title: "New Message",
    message: "Your agent has sent you a message regarding material selection.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    actionUrl: "/account/messages",
    actionLabel: "View Messages",
  },
  {
    id: "notif-5",
    type: "success",
    title: "Document Uploaded",
    message: "Building permit has been uploaded to your project documents.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    read: true,
    actionUrl: "/account/documents",
    actionLabel: "View Documents",
  },
];

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "activity-1",
    type: "milestone_completed",
    title: "Foundation Pour Completed",
    description: "The foundation pour milestone has been successfully completed ahead of schedule.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    projectId: 88,
    projectTitle: "Urban Duplex A2 - Lagos",
  },
  {
    id: "activity-2",
    type: "quote_received",
    title: "New Quote Available",
    description: "You have received a detailed quote for your Eco Bungalow construction request.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    projectId: 73,
    projectTitle: "Eco Bungalow S1 - Accra",
  },
  {
    id: "activity-3",
    type: "project_update",
    title: "Project Status Update",
    description: "Rebar has been delivered to the construction site and inspected.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    projectId: 88,
    projectTitle: "Urban Duplex A2 - Lagos",
  },
  {
    id: "activity-4",
    type: "message_received",
    title: "Message from Agent",
    description: "Your agent has sent you updates about material selection options.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    projectId: 88,
    projectTitle: "Urban Duplex A2 - Lagos",
  },
  {
    id: "activity-5",
    type: "document_uploaded",
    title: "Building Permit Uploaded",
    description: "The building permit document has been uploaded and is ready for review.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    projectId: 88,
    projectTitle: "Urban Duplex A2 - Lagos",
  },
  {
    id: "activity-6",
    type: "payment_due",
    title: "Payment Reminder",
    description: "Your next milestone payment of GHS 15,000 is due in 3 days.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    projectId: 88,
    projectTitle: "Urban Duplex A2 - Lagos",
  },
];

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  sms: false,
  inApp: true,
  projectUpdates: true,
  quoteNotifications: true,
  paymentReminders: true,
  marketingEmails: false,
};
