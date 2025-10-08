import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../data/db';
import type { Property, Region } from '../types';

interface BulkUploadResult {
  success: Property[];
  errors: Array<{ index: number; error: string }>;
}

interface BulkPropertyUploadProps {
  onUploadComplete?: () => void;
}

export default function BulkPropertyUpload({ onUploadComplete }: BulkPropertyUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const regions = db.listRegions();

  const downloadTemplate = () => {
    const template = [
      'title,price,status,location,type,region,bedrooms,bathrooms,area_sq_m,sustainability_score,eco_features',
      'Sample Property,120000,Live,"Accra, Ghana",Apartment,GH-GA,2,2,85,75,"solar_panels,led_lighting"',
      'Another Property,95000,Draft,"Kumasi, Ghana",House,GH-AS,3,2,120,80,"rainwater_harvesting,recycled_materials"'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const validateAndTransformRow = (row: Record<string, string>, index: number): Omit<Property, 'id'> | null => {
    try {
      // Required fields validation
      if (!row.title || !row.price) {
        throw new Error('Title and price are required');
      }

      // Validate region
      if (row.region && !regions.find(r => r.code === row.region)) {
        throw new Error(`Invalid region code: ${row.region}`);
      }

      // Parse eco features
      const eco_features = row.eco_features 
        ? row.eco_features.split(';').map(f => f.trim()).filter(Boolean)
        : [];

      const property: Omit<Property, 'id'> = {
        title: row.title,
        price: parseFloat(row.price) || 0,
        status: (row.status as Property['status']) || 'Draft',
        location: row.location || '',
        type: row.type || '',
        region: row.region || '',
        currency: 'GHS',
        bedrooms: parseInt(row.bedrooms) || undefined,
        bathrooms: parseInt(row.bathrooms) || undefined,
        area_sq_m: parseFloat(row.area_sq_m) || undefined,
        sustainability_score: parseInt(row.sustainability_score) || undefined,
        eco_features,
      };

      return property;
    } catch (error) {
      console.error(`Row ${index + 1} validation error:`, error);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error('No data found in CSV file');
      }

      const properties: Omit<Property, 'id'>[] = [];
      const parseErrors: Array<{ index: number; error: string }> = [];

      // Validate and transform each row
      rows.forEach((row, index) => {
        setProgress(((index + 1) / rows.length) * 50); // First 50% for parsing
        
        const property = validateAndTransformRow(row, index);
        if (property) {
          properties.push(property);
        } else {
          parseErrors.push({ index: index + 1, error: 'Failed to parse row' });
        }
      });

      // Bulk create properties
      setProgress(75);
      const bulkResult = db.bulkCreateProperties(properties);
      
      setProgress(100);
      setResult({
        success: bulkResult.success,
        errors: [
          ...parseErrors,
          ...bulkResult.errors.map(e => ({ index: e.index + 1, error: e.error }))
        ]
      });

      // Notify parent component of successful upload
      if (bulkResult.success.length > 0) {
        onUploadComplete?.();
      }

    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: [],
        errors: [{ index: 0, error: error instanceof Error ? error.message : 'Upload failed' }]
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Property Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          
          <div className="flex-1">
            <Label htmlFor="csv-upload">Upload CSV File</Label>
            <Input
              id="csv-upload"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="mt-1"
            />
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.success.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully uploaded {result.success.length} properties.
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>{result.errors.length} errors occurred:</div>
                    <div className="max-h-32 overflow-y-auto text-xs">
                      {result.errors.slice(0, 10).map((error, i) => (
                        <div key={i}>
                          Row {error.index}: {error.error}
                        </div>
                      ))}
                      {result.errors.length > 10 && (
                        <div>... and {result.errors.length - 10} more errors</div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>CSV Format Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Required columns: title, price</li>
            <li>Optional columns: status, location, type, region, bedrooms, bathrooms, area_sq_m, sustainability_score</li>
            <li>Eco features should be separated by semicolons (;)</li>
            <li>Valid regions: {regions.map(r => r.code).join(', ')}</li>
            <li>Valid status values: Draft, Live, Sold, Rented</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}