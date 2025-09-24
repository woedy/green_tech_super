import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PropertyFilters from "@/components/properties/PropertyFilters";

describe("PropertyFilters", () => {
  it("calls onEcoFeaturesChange when toggling eco feature checkboxes", async () => {
    const user = userEvent.setup();
    const onEco = vi.fn();
    render(
      <PropertyFilters
        selectedType="all"
        onTypeChange={() => {}}
        selectedRegion="All"
        onRegionChange={() => {}}
        selectedEcoFeatures={[]}
        onEcoFeaturesChange={onEco}
      />
    );

    const solar = screen.getByText("Solar");
    await user.click(solar);
    expect(onEco).toHaveBeenCalled();
  });
});
