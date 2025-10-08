import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PaymentCalculation {
  loan_amount: number;
  down_payment: number;
  payment_amount: number;
  payment_frequency: string;
  total_interest: number;
  total_payment: number;
  term_months: number;
}

interface FinancingOption {
  id: number;
  name: string;
  description: string;
  interest_rate: string;
  min_loan_amount: string;
  max_loan_amount: string;
  min_loan_term: number;
  max_loan_term: number;
}

export const FinancingCalculator: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [termMonths, setTermMonths] = useState<string>('');
  const [paymentFrequency, setPaymentFrequency] = useState<string>('monthly');
  const [calculation, setCalculation] = useState<PaymentCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch financing options
  const { data: financingOptions } = useQuery<FinancingOption[]>({
    queryKey: ['financing-options'],
    queryFn: () => api.get('/api/v1/finances/financing-options/'),
  });

  const handleCalculate = async () => {
    if (!amount || !interestRate || !termMonths) return;

    setIsCalculating(true);
    try {
      const result = await api.post<PaymentCalculation>('/api/v1/finances/payment-plans/calculate/', {
        amount: parseFloat(amount),
        down_payment: parseFloat(downPayment) || 0,
        interest_rate: parseFloat(interestRate),
        term_months: parseInt(termMonths),
        payment_frequency: paymentFrequency,
      });
      setCalculation(result);
    } catch (error) {
      console.error('Error calculating payment:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinancingOptionSelect = (optionId: string) => {
    const option = financingOptions?.find(o => o.id.toString() === optionId);
    if (option) {
      setInterestRate(option.interest_rate);
      setTermMonths('240'); // Default to 20 years
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financing Calculator
          </CardTitle>
          <CardDescription>
            Calculate your monthly payments and total costs for eco-friendly property financing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Financing Options */}
          {financingOptions && financingOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="financing-option">Choose a Financing Option</Label>
              <Select onValueChange={handleFinancingOptionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a financing option" />
                </SelectTrigger>
                <SelectContent>
                  {financingOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.name} ({option.interest_rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Manual Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Property Value (GHS)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="down-payment">Down Payment (GHS)</Label>
              <Input
                id="down-payment"
                type="number"
                placeholder="20,000"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <Input
                id="interest-rate"
                type="number"
                step="0.1"
                placeholder="5.0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Loan Term (months)</Label>
              <Input
                id="term"
                type="number"
                placeholder="240"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Payment Frequency</Label>
            <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full" 
            disabled={isCalculating || !amount || !interestRate || !termMonths}
          >
            {isCalculating ? 'Calculating...' : 'Calculate Payment'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Payment Breakdown
          </CardTitle>
          <CardDescription>
            Your financing details and payment schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calculation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculation.payment_amount)}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {calculation.payment_frequency} Payment
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(calculation.term_months / 12)} years
                  </div>
                  <div className="text-sm text-gray-600">
                    Loan Term
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="font-semibold">{formatCurrency(calculation.loan_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Down Payment:</span>
                  <span className="font-semibold">{formatCurrency(calculation.down_payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest:</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(calculation.total_interest)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-900 font-semibold">Total Payment:</span>
                  <span className="font-bold text-lg">{formatCurrency(calculation.total_payment)}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is an estimate. Actual rates and terms may vary based on your credit profile and the lender's requirements.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter your details and click "Calculate Payment" to see your financing breakdown.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};