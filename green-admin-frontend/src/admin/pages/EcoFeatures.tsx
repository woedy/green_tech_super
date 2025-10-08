import EcoFeatureManagement from '../components/EcoFeatureManagement';

export default function EcoFeatures() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Eco Features Catalog</h2>
      </div>
      
      <EcoFeatureManagement />
    </div>
  );
}