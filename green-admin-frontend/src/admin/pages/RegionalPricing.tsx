import RegionalPricingManagement from '../components/RegionalPricingManagement';

export default function RegionalPricing() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Regional Pricing Management</h2>
      </div>
      
      <RegionalPricingManagement />
    </div>
  );
}