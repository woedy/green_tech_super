import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuoteBuilderForm } from "../QuoteBuilderForm";

describe("QuoteBuilderForm", () => {
  const mockOnItemsChange = vi.fn();
  const mockOnNotesChange = vi.fn();
  const mockOnTermsChange = vi.fn();

  const defaultProps = {
    currency: "GHS",
    regionalMultiplier: 1.2,
    onItemsChange: mockOnItemsChange,
    onNotesChange: mockOnNotesChange,
    onTermsChange: mockOnTermsChange,
    notes: "Test notes",
    terms: "Test terms",
  };

  it("renders empty state when no items", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    expect(screen.getByText(/No line items yet/i)).toBeInTheDocument();
  });

  it("displays regional multiplier badge", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    expect(screen.getByText(/Regional Multiplier: ×1.20/i)).toBeInTheDocument();
  });

  it("calls onItemsChange when adding a line item", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    const addButton = screen.getByRole("button", { name: /Add Line Item/i });
    fireEvent.click(addButton);
    expect(mockOnItemsChange).toHaveBeenCalled();
  });

  it("calls onNotesChange when notes are updated", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    const notesTextarea = screen.getByLabelText(/Internal Notes/i);
    fireEvent.change(notesTextarea, { target: { value: "Updated notes" } });
    expect(mockOnNotesChange).toHaveBeenCalledWith("Updated notes");
  });

  it("calls onTermsChange when terms are updated", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    fireEvent.change(termsTextarea, { target: { value: "Updated terms" } });
    expect(mockOnTermsChange).toHaveBeenCalledWith("Updated terms");
  });

  it("displays quote summary with correct totals", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    expect(screen.getByText(/Quote Summary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Subtotal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Total/i).length).toBeGreaterThan(0);
  });

  it("formats currency correctly", () => {
    render(<QuoteBuilderForm {...defaultProps} />);
    expect(screen.getAllByText(/GHS/i).length).toBeGreaterThan(0);
  });

  it("renders with initial items", () => {
    const initialItems = [
      {
        id: "1",
        label: "Test Item",
        kind: "base" as const,
        quantity: 1,
        unit_cost: 1000,
        apply_region_multiplier: true,
        calculated_total: 1200,
        position: 0,
      },
    ];
    render(<QuoteBuilderForm {...defaultProps} initialItems={initialItems} />);
    expect(screen.getByDisplayValue("Test Item")).toBeInTheDocument();
  });

  it("calculates totals with regional multiplier", () => {
    const initialItems = [
      {
        id: "1",
        label: "Base Item",
        kind: "base" as const,
        quantity: 1,
        unit_cost: 1000,
        apply_region_multiplier: true,
        calculated_total: 1200,
        position: 0,
      },
    ];
    render(<QuoteBuilderForm {...defaultProps} initialItems={initialItems} />);
    // With multiplier of 1.2, 1000 * 1.2 = 1200
    expect(screen.getAllByText(/GHS 1,200/i).length).toBeGreaterThan(0);
  });
});
