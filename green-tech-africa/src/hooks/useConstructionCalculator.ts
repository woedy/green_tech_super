import { useMemo } from 'react';
import { ECO_FEATURES, GHANA_REGIONS } from '@/mocks/construction';
import { CostBreakdown, SustainabilityMetrics } from '@/types/construction';

export const useConstructionCalculator = () => {
  const calculateCost = (selectedFeatures: string[], region: string): number => {
    const baseConstructionCost = 50000; // Base cost in GHS
    
    const regionData = GHANA_REGIONS.find(r => r.id === region);
    const regionalMultiplier = regionData?.costMultiplier || 1.0;
    
    const featuresTotal = selectedFeatures.reduce((total, featureId) => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      if (!feature) return total;
      
      const regionalCost = feature.baseCost * (feature.regionalMultiplier[region] || 1.0);
      return total + regionalCost;
    }, 0);
    
    return Math.round((baseConstructionCost + featuresTotal) * regionalMultiplier);
  };

  const calculateSustainabilityScore = (selectedFeatures: string[]): number => {
    const totalPoints = selectedFeatures.reduce((total, featureId) => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      return total + (feature?.sustainabilityPoints || 0);
    }, 0);
    
    // Cap at 100 points
    return Math.min(totalPoints, 100);
  };

  const calculateSavings = (selectedFeatures: string[]) => {
    const savings = selectedFeatures.reduce((total, featureId) => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      if (!feature?.estimatedSavings) return total;
      
      return {
        monthly: total.monthly + feature.estimatedSavings.monthly,
        annual: total.annual + feature.estimatedSavings.annual
      };
    }, { monthly: 0, annual: 0 });
    
    return savings;
  };

  const getCostBreakdown = (selectedFeatures: string[], region: string): CostBreakdown => {
    const baseConstruction = 50000;
    const regionData = GHANA_REGIONS.find(r => r.id === region);
    const regionalMultiplier = regionData?.costMultiplier || 1.0;
    
    const ecoFeatures = selectedFeatures.reduce((total, featureId) => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      if (!feature) return total;
      
      const regionalCost = feature.baseCost * (feature.regionalMultiplier[region] || 1.0);
      return total + regionalCost;
    }, 0);
    
    const subtotal = baseConstruction + ecoFeatures;
    const regionalAdjustment = subtotal * (regionalMultiplier - 1);
    const total = subtotal + regionalAdjustment;
    
    return {
      baseConstruction,
      ecoFeatures,
      regionalAdjustment,
      total: Math.round(total),
      currency: 'GHS'
    };
  };

  const getSustainabilityMetrics = (selectedFeatures: string[]): SustainabilityMetrics => {
    const categoryScores = {
      energy: 0,
      water: 0,
      materials: 0,
      waste: 0,
      smart: 0
    };
    
    const savingsBreakdown: Array<{
      feature: string;
      monthly: number;
      annual: number;
    }> = [];
    
    let totalMonthly = 0;
    let totalAnnual = 0;
    
    selectedFeatures.forEach(featureId => {
      const feature = ECO_FEATURES.find(f => f.id === featureId);
      if (!feature) return;
      
      categoryScores[feature.category] += feature.sustainabilityPoints;
      
      if (feature.estimatedSavings) {
        totalMonthly += feature.estimatedSavings.monthly;
        totalAnnual += feature.estimatedSavings.annual;
        savingsBreakdown.push({
          feature: feature.name,
          monthly: feature.estimatedSavings.monthly,
          annual: feature.estimatedSavings.annual
        });
      }
    });
    
    const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
    
    return {
      totalScore: Math.min(totalScore, 100),
      categoryScores,
      estimatedSavings: {
        monthly: totalMonthly,
        annual: totalAnnual,
        breakdown: savingsBreakdown
      }
    };
  };

  const getFeaturesByCategory = useMemo(() => {
    const categories = {
      energy: ECO_FEATURES.filter(f => f.category === 'energy'),
      water: ECO_FEATURES.filter(f => f.category === 'water'),
      materials: ECO_FEATURES.filter(f => f.category === 'materials'),
      waste: ECO_FEATURES.filter(f => f.category === 'waste'),
      smart: ECO_FEATURES.filter(f => f.category === 'smart')
    };
    return categories;
  }, []);

  return {
    calculateCost,
    calculateSustainabilityScore,
    calculateSavings,
    getCostBreakdown,
    getSustainabilityMetrics,
    getFeaturesByCategory
  };
};