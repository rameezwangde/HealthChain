'use client';

import { useState } from 'react';
import {
  forecastDemand,
  type ForecastDemandOutput,
} from '@/ai/flows/forecast-demand';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HospitalDashboardPage() {
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastDemandOutput | null>(null);
  
  const handleForecast = async () => {
    if (!pincode) {
        setError('Please enter a pincode.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setForecast(null);
    try {
      const result = await forecastDemand({ pincode });
      setForecast(result);
    } catch (e) {
      console.error(e);
      setError('Failed to generate forecast. The AI model might be unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDemandBadgeVariant = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'Low':
        return 'bg-green-500 hover:bg-green-600';
      case 'Medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'High':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Demand Forecaster</CardTitle>
          <CardDescription>
            Enter a pincode to predict patient demand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              placeholder="e.g., 90210"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              disabled={isLoading}
            />
          </div>
           {error && !isLoading && (
              <Alert variant="destructive" className="text-xs">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleForecast} disabled={isLoading || !pincode} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Forecast Demand
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>AI-Powered Forecast</CardTitle>
          <CardDescription>
            Generated predictions and suggested actions will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[250px] flex items-center justify-center">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Analyzing data for pincode {pincode}...</p>
            </div>
          ) : forecast ? (
            <div className="space-y-6 w-full">
                <div>
                    <Label className="text-xs text-muted-foreground">Demand Level</Label>
                    <Badge className={`text-base font-bold text-white mt-1 ${getDemandBadgeVariant(forecast.demandLevel)}`}>{forecast.demandLevel}</Badge>
                </div>
                 <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><Lightbulb className="text-yellow-400" />Reasoning</h3>
                    <p className="text-sm text-foreground/90">{forecast.reasoning}</p>
                 </div>
                 <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><CheckCircle className="text-green-500" />Suggested Actions</h3>
                    <ul className="space-y-2 list-disc pl-5 text-sm">
                        {forecast.suggestedActions.map((action, i) => <li key={i}>{action}</li>)}
                    </ul>
                 </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground h-full p-8">
                <TrendingUp className="h-10 w-10" />
                <p>Enter a pincode and click "Forecast Demand" to see AI-powered predictions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
