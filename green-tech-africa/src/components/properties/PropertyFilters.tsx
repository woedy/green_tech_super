import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type PropertyFiltersProps = {
  selectedType: string;
  onTypeChange: (v: string) => void;
  selectedRegion: string;
  onRegionChange: (v: string) => void;
  selectedEcoFeatures: string[];
  onEcoFeaturesChange: (v: string[]) => void;
  availableTypes?: string[];
  ghanaRegions?: string[];
  availableEcoFeatures?: string[];
  orientation?: 'column' | 'row';
  className?: string;
};

export default function PropertyFilters({
  selectedType,
  onTypeChange,
  selectedRegion,
  onRegionChange,
  selectedEcoFeatures,
  onEcoFeaturesChange,
  availableTypes = ["All", "Villa", "Apartment", "Townhouse", "Penthouse", "Commercial", "Industrial"],
  ghanaRegions = ["All", "Accra", "Kumasi", "Tamale", "Cape Coast", "Takoradi"],
  availableEcoFeatures = ["Solar", "Rainwater Harvesting", "Low-flow Fixtures", "Insulation", "LED Lighting"],
  orientation = 'column',
  className = '',
}: PropertyFiltersProps) {
  const toggleFeature = (f: string) => {
    if (selectedEcoFeatures.includes(f)) {
      onEcoFeaturesChange(selectedEcoFeatures.filter((x) => x !== f));
    } else {
      onEcoFeaturesChange([...selectedEcoFeatures, f]);
    }
  };

  const containerBase = orientation === 'row'
    ? 'flex flex-wrap items-center gap-2 '
    : 'flex flex-col gap-4 ';

  return (
    <div className={`${containerBase} w-full ${className}`}>
      <div className={orientation === 'row' ? 'flex items-center gap-2 flex-wrap' : 'flex gap-2 items-center flex-wrap'}>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            {availableTypes.map((t) => (
              <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRegion} onValueChange={onRegionChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ghana Region" />
          </SelectTrigger>
          <SelectContent>
            {ghanaRegions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={orientation === 'row' ? 'flex items-center gap-3 flex-wrap' : 'flex items-center gap-4 flex-wrap'}>
        {availableEcoFeatures.map((f) => (
          <label
            key={f}
            className="flex items-center gap-2 text-sm"
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('button')) {
                return;
              }
              toggleFeature(f);
            }}
          >
            <Checkbox
              checked={selectedEcoFeatures.includes(f)}
              onCheckedChange={() => toggleFeature(f)}
            />
            <Label className="text-sm cursor-pointer">{f}</Label>
          </label>
        ))}
      </div>
    </div>
  );
}
