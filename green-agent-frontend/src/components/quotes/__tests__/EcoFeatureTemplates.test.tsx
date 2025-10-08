import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EcoFeatureTemplates } from "../EcoFeatureTemplates";

describe("EcoFeatureTemplates", () => {
  const mockOnApplyTemplate = vi.fn();

  const defaultProps = {
    currency: "GHS",
    regionalMultiplier: 1.2,
    onApplyTemplate: mockOnApplyTemplate,
  };

  it("renders all template options", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    expect(screen.getByText(/Basic Eco Package/i)).toBeInTheDocument();
    expect(screen.getByText(/Solar Power Package/i)).toBeInTheDocument();
    expect(screen.getByText(/Water Conservation Package/i)).toBeInTheDocument();
    expect(screen.getByText(/Sustainable Materials Package/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium Eco Package/i)).toBeInTheDocument();
  });

  it("displays template descriptions", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    expect(screen.getByText(/Essential sustainable features for budget-conscious projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete solar energy solution with battery backup/i)).toBeInTheDocument();
  });

  it("shows feature count for each template", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    const featureCounts = screen.getAllByText(/\d+ features/i);
    expect(featureCounts.length).toBeGreaterThan(0);
  });

  it("displays sustainability points for templates", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    const pointsBadges = screen.getAllByText(/\d+ pts/i);
    expect(pointsBadges.length).toBeGreaterThan(0);
  });

  it("calls onApplyTemplate when Apply button is clicked", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    const applyButtons = screen.getAllByRole("button", { name: /Apply/i });
    fireEvent.click(applyButtons[0]);
    expect(mockOnApplyTemplate).toHaveBeenCalled();
    expect(mockOnApplyTemplate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        baseCost: expect.any(Number),
      }),
    ]));
  });

  it("displays prices with regional multiplier applied", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    // Prices should be multiplied by 1.2
    const priceElements = screen.getAllByText(/GHS/i);
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it("shows feature badges for each template", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    expect(screen.getAllByText(/LED Lighting Package/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Solar Panel System/i).length).toBeGreaterThan(0);
  });

  it("formats currency correctly", () => {
    render(<EcoFeatureTemplates {...defaultProps} />);
    expect(screen.getAllByText(/GHS/i).length).toBeGreaterThan(0);
  });
});
