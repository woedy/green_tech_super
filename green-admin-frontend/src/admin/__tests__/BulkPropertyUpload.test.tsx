import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkPropertyUpload from '../components/BulkPropertyUpload';

// Mock the database
vi.mock('../data/db', () => ({
  db: {
    listRegions: vi.fn(() => [
      { code: 'GH-GA', name: 'Greater Accra', currency: 'GHS', multiplier: 1.14 },
      { code: 'GH-AS', name: 'Ashanti', currency: 'GHS', multiplier: 1.25 }
    ]),
    bulkCreateProperties: vi.fn(() => ({
      success: [
        { id: 1, title: 'Test Property 1', price: 100000 },
        { id: 2, title: 'Test Property 2', price: 120000 }
      ],
      errors: []
    }))
  }
}));

// Mock file reading
const mockFileReader = {
  readAsText: vi.fn(),
  result: '',
  onload: null as any,
  onerror: null as any
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader)
});

describe('BulkPropertyUpload', () => {
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader.result = '';
  });

  it('should render upload interface', () => {
    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    expect(screen.getByText('Bulk Property Upload')).toBeInTheDocument();
    expect(screen.getByText('Download Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload CSV File')).toBeInTheDocument();
  });

  it('should download template when button is clicked', () => {
    // Mock URL.createObjectURL and related methods
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();

    Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });
    
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    const downloadButton = screen.getByText('Download Template');
    fireEvent.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('should process CSV file upload successfully', async () => {
    const csvContent = `title,price,status,location,type,region
Test Property 1,100000,Live,"Accra, Ghana",Apartment,GH-GA
Test Property 2,120000,Draft,"Kumasi, Ghana",House,GH-AS`;

    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    const fileInput = screen.getByLabelText('Upload CSV File');
    const file = new File([csvContent], 'properties.csv', { type: 'text/csv' });

    // Mock FileReader behavior
    mockFileReader.result = csvContent;
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Simulate FileReader onload
    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Successfully uploaded 2 properties/)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).toHaveBeenCalled();
  });

  it('should handle CSV parsing errors', async () => {
    const invalidCsvContent = `title,price,status
,0,Live
Valid Property,100000,Draft`;

    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    const fileInput = screen.getByLabelText('Upload CSV File');
    const file = new File([invalidCsvContent], 'invalid.csv', { type: 'text/csv' });

    mockFileReader.result = invalidCsvContent;
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: invalidCsvContent } } as any);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/errors occurred/)).toBeInTheDocument();
    });
  });

  it('should show progress during upload', async () => {
    const csvContent = `title,price,status
Test Property,100000,Live`;

    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    const fileInput = screen.getByLabelText('Upload CSV File');
    const file = new File([csvContent], 'properties.csv', { type: 'text/csv' });

    mockFileReader.result = csvContent;
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should display CSV format requirements', () => {
    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    expect(screen.getByText('CSV Format Requirements:')).toBeInTheDocument();
    expect(screen.getByText(/Required columns: title, price/)).toBeInTheDocument();
    expect(screen.getByText(/Valid regions: GH-GA, GH-AS/)).toBeInTheDocument();
  });

  it('should handle empty file', async () => {
    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    const fileInput = screen.getByLabelText('Upload CSV File');
    const file = new File([''], 'empty.csv', { type: 'text/csv' });

    mockFileReader.result = '';
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: '' } } as any);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/No data found in CSV file/)).toBeInTheDocument();
    });
  });

  it('should validate region codes', async () => {
    const csvContent = `title,price,status,region
Test Property,100000,Live,INVALID-REGION`;

    render(<BulkPropertyUpload onUploadComplete={mockOnUploadComplete} />);
    
    const fileInput = screen.getByLabelText('Upload CSV File');
    const file = new File([csvContent], 'properties.csv', { type: 'text/csv' });

    mockFileReader.result = csvContent;
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: csvContent } } as any);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid region code: INVALID-REGION/)).toBeInTheDocument();
    });
  });
});