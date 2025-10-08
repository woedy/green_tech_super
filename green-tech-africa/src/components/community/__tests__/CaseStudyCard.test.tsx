import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CaseStudyCard } from '../CaseStudyCard';

const mockCaseStudy = {
  id: 1,
  title: 'Solar-Powered Community Center',
  slug: 'solar-powered-community-center',
  location: 'Accra, Ghana',
  project_type: 'community',
  overview: 'A sustainable community center powered entirely by solar energy with rainwater harvesting.',
  energy_savings: 85,
  water_savings: 60,
  cost_savings: 12000,
  co2_reduction: 2500,
  featured: true,
  created_at: '2023-06-15T10:00:00Z',
  images: [
    {
      id: 1,
      image: '/images/community-center.jpg',
      caption: 'Solar panels on the roof',
      is_primary: true,
    },
  ],
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CaseStudyCard', () => {
  it('renders case study information correctly', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    expect(screen.getByText('Solar-Powered Community Center')).toBeInTheDocument();
    expect(screen.getByText('Accra, Ghana')).toBeInTheDocument();
    expect(screen.getByText('community')).toBeInTheDocument();
    expect(screen.getByText(/sustainable community center/)).toBeInTheDocument();
  });

  it('displays impact metrics correctly', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Energy Saved')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('Water Saved')).toBeInTheDocument();
    expect(screen.getByText(/GH₵12,000/)).toBeInTheDocument();
    expect(screen.getByText('Annual Savings')).toBeInTheDocument();
    expect(screen.getByText('2500kg')).toBeInTheDocument();
    expect(screen.getByText('CO₂ Reduced')).toBeInTheDocument();
  });

  it('shows featured badge for featured case studies', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not show featured badge for non-featured case studies', () => {
    const nonFeaturedCaseStudy = { ...mockCaseStudy, featured: false };
    renderWithRouter(<CaseStudyCard caseStudy={nonFeaturedCaseStudy} />);
    
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('renders primary image when available', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    const image = screen.getByAltText('Solar panels on the roof');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/community-center.jpg');
  });

  it('renders view case study link', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    const link = screen.getByRole('link', { name: /View Full Case Study/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/community/case-studies/solar-powered-community-center');
  });

  it('formats currency correctly', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    // Should format as Ghana Cedis
    expect(screen.getByText(/GH₵12,000/)).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    renderWithRouter(<CaseStudyCard caseStudy={mockCaseStudy} />);
    
    expect(screen.getByText(/Published/)).toBeInTheDocument();
    expect(screen.getByText(/15 June 2023/)).toBeInTheDocument();
  });
});