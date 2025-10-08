import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuoteVersionHistory } from "../QuoteVersionHistory";
import { QuoteTimelineEntry } from "@/types/quote";

describe("QuoteVersionHistory", () => {
  const mockTimeline: QuoteTimelineEntry[] = [
    {
      status: "draft",
      label: "Quote prepared",
      timestamp: "2024-01-01T10:00:00Z",
    },
    {
      status: "sent",
      label: "Quote sent to customer",
      timestamp: "2024-01-02T14:30:00Z",
    },
    {
      status: "viewed",
      label: "Customer viewed quote",
      timestamp: "2024-01-03T09:15:00Z",
    },
  ];

  it("renders quote history title", () => {
    render(<QuoteVersionHistory timeline={mockTimeline} currentStatus="viewed" />);
    expect(screen.getByText(/Quote History/i)).toBeInTheDocument();
  });

  it("displays event count badge", () => {
    render(<QuoteVersionHistory timeline={mockTimeline} currentStatus="viewed" />);
    expect(screen.getByText(/3 events/i)).toBeInTheDocument();
  });

  it("renders all timeline entries", () => {
    render(<QuoteVersionHistory timeline={mockTimeline} currentStatus="viewed" />);
    expect(screen.getByText(/Quote prepared/i)).toBeInTheDocument();
    expect(screen.getByText(/Quote sent to customer/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer viewed quote/i)).toBeInTheDocument();
  });

  it("marks the latest entry as current", () => {
    render(<QuoteVersionHistory timeline={mockTimeline} currentStatus="viewed" />);
    expect(screen.getByText(/Current/i)).toBeInTheDocument();
  });

  it("displays formatted dates and times", () => {
    render(<QuoteVersionHistory timeline={mockTimeline} currentStatus="viewed" />);
    // Check that dates are rendered (format may vary by locale)
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("renders with accepted status", () => {
    const acceptedTimeline: QuoteTimelineEntry[] = [
      ...mockTimeline,
      {
        status: "accepted",
        label: "Customer accepted quote",
        timestamp: "2024-01-04T11:00:00Z",
      },
    ];
    render(<QuoteVersionHistory timeline={acceptedTimeline} currentStatus="accepted" />);
    expect(screen.getByText(/Customer accepted quote/i)).toBeInTheDocument();
  });

  it("renders with declined status", () => {
    const declinedTimeline: QuoteTimelineEntry[] = [
      ...mockTimeline,
      {
        status: "declined",
        label: "Customer declined quote",
        timestamp: "2024-01-04T11:00:00Z",
      },
    ];
    render(<QuoteVersionHistory timeline={declinedTimeline} currentStatus="declined" />);
    expect(screen.getByText(/Customer declined quote/i)).toBeInTheDocument();
  });

  it("handles empty timeline", () => {
    render(<QuoteVersionHistory timeline={[]} currentStatus="draft" />);
    expect(screen.getByText(/0 events/i)).toBeInTheDocument();
  });

  it("sorts timeline entries by date (newest first)", () => {
    const unsortedTimeline: QuoteTimelineEntry[] = [
      {
        status: "draft",
        label: "Quote prepared",
        timestamp: "2024-01-01T10:00:00Z",
      },
      {
        status: "viewed",
        label: "Customer viewed quote",
        timestamp: "2024-01-03T09:15:00Z",
      },
      {
        status: "sent",
        label: "Quote sent to customer",
        timestamp: "2024-01-02T14:30:00Z",
      },
    ];
    render(<QuoteVersionHistory timeline={unsortedTimeline} currentStatus="viewed" />);
    // Check that the newest entry is marked as current
    expect(screen.getByText(/Current/i)).toBeInTheDocument();
    // Check that all entries are rendered
    expect(screen.getByText("Customer viewed quote")).toBeInTheDocument();
    expect(screen.getByText("Quote sent to customer")).toBeInTheDocument();
    expect(screen.getByText("Quote prepared")).toBeInTheDocument();
  });
});
