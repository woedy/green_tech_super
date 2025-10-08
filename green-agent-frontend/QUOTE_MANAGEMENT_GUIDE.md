# Quote Management System - Agent Portal

## Overview

The Quote Management system in the Green Tech Africa Agent Portal provides comprehensive tools for creating, managing, and tracking construction quotes with Ghana-specific pricing and eco-feature integration.

## Features Implemented

### 1. Quote Builder Interface (`QuoteBuilderForm`)

**Location**: `src/components/quotes/QuoteBuilderForm.tsx`

**Key Features**:
- **Line Item Management**: Add, edit, and remove quote line items with different types (base, option, allowance, adjustment)
- **Ghana Regional Pricing**: Automatic application of regional multipliers for accurate local pricing
- **Real-time Calculations**: Live updates of totals as items are modified
- **Currency Support**: Full Ghana Cedis (GHS) formatting and display
- **Notes & Terms**: Customizable internal notes and customer-facing terms

**Usage**:
```tsx
<QuoteBuilderForm
  currency="GHS"
  regionalMultiplier={1.25}
  onItemsChange={handleItemsChange}
  onNotesChange={handleNotesChange}
  onTermsChange={handleTermsChange}
  notes={notes}
  terms={terms}
/>
```

### 2. Eco-Feature Templates (`EcoFeatureTemplates`)

**Location**: `src/components/quotes/EcoFeatureTemplates.tsx`

**Key Features**:
- **Pre-built Templates**: 5 eco-feature packages (Basic, Solar Power, Water Conservation, Sustainable Materials, Premium)
- **Ghana-Specific Features**: Locally available eco-features with regional pricing
- **Sustainability Scoring**: Visual sustainability points for each template
- **One-Click Application**: Easy template application to quotes
- **Cost Transparency**: Clear pricing breakdown with regional multipliers

**Available Templates**:
1. **Basic Eco Package**: Essential sustainable features for budget projects
2. **Solar Power Package**: Complete solar energy solution with battery backup
3. **Water Conservation Package**: Comprehensive water management and recycling
4. **Sustainable Materials Package**: Eco-friendly building materials
5. **Premium Eco Package**: Complete sustainable building solution

### 3. Quote Version History (`QuoteVersionHistory`)

**Location**: `src/components/quotes/QuoteVersionHistory.tsx`

**Key Features**:
- **Timeline Tracking**: Visual timeline of quote status changes
- **Status Indicators**: Clear visual indicators for each quote status
- **Timestamp Display**: Ghana-appropriate date and time formatting
- **Current Status Highlighting**: Clear indication of current quote state

**Supported Statuses**:
- Draft: Quote being prepared
- Sent: Quote sent to customer
- Viewed: Customer has viewed the quote
- Accepted: Customer has accepted the quote
- Declined: Customer has declined the quote

### 4. Quote Management Pages

#### Quote List Page (`src/pages/agent/Quotes.tsx`)

**Features**:
- **Filterable List**: Filter quotes by status
- **Quick Actions**: Send, view, and manage quotes
- **Ghana Currency Display**: Proper GHS formatting
- **Status Management**: Visual status indicators and workflow actions

#### Quote Builder Page (`src/pages/agent/QuoteBuilder.tsx`)

**Features**:
- **Build Request Integration**: Automatic loading of customer build requests
- **Customer Information**: Pre-populated customer details
- **Agent Information**: Agent details and contact information
- **Tabbed Interface**: Separate tabs for quote building and eco-templates
- **Ghana Context**: Regional pricing and currency handling

#### Quote Detail Page (`src/pages/account/QuoteDetail.tsx`)

**Features**:
- **Comprehensive View**: Complete quote details with line items
- **Customer Preview**: HTML preview of customer-facing quote document
- **Action Management**: Status-appropriate actions (send, accept, decline)
- **Timeline Display**: Complete quote history and status changes

## API Integration

### Quote Endpoints

**Base URL**: `/api/quotes/`

**Available Endpoints**:
- `GET /api/quotes/` - List quotes with filtering
- `POST /api/quotes/` - Create new quote
- `GET /api/quotes/{id}/` - Get quote details
- `PATCH /api/quotes/{id}/` - Update quote
- `POST /api/quotes/{id}/send/` - Send quote to customer
- `POST /api/quotes/{id}/view/` - Mark quote as viewed
- `POST /api/quotes/{id}/accept/` - Accept quote
- `POST /api/quotes/{id}/decline/` - Decline quote

### Quote Data Structure

```typescript
interface QuoteDetail {
  id: string;
  reference: string;
  status: QuoteStatus;
  currency_code: string;
  subtotal_amount: number;
  allowance_amount: number;
  adjustment_amount: number;
  total_amount: number;
  regional_multiplier: number;
  customer_name: string;
  customer_email: string;
  items: QuoteLineItem[];
  timeline: QuoteTimelineEntry[];
  // ... additional fields
}
```

## Ghana-Specific Features

### Regional Pricing Multipliers

The system automatically applies Ghana-specific regional multipliers to account for:
- **Transportation Costs**: Distance from major supply centers
- **Local Labor Rates**: Regional wage variations
- **Material Availability**: Local vs. imported material costs
- **Infrastructure**: Access to utilities and services

### Currency Handling

- **Primary Currency**: Ghana Cedis (GHS)
- **Formatting**: Proper GHS currency formatting throughout
- **Calculations**: All calculations maintain precision for GHS amounts
- **Display**: Consistent currency display across all components

### Eco-Features for Ghana

The system includes eco-features specifically relevant to Ghana:
- **Solar Panels**: High solar potential in Ghana
- **Rainwater Harvesting**: Important for water security
- **Local Timber**: Sustainable forestry options
- **Eco-Cement**: Locally produced sustainable cement
- **Water-Efficient Fixtures**: Critical for water conservation

## Testing

### Test Coverage

**Location**: `src/components/quotes/__tests__/`

**Test Files**:
- `QuoteBuilderForm.test.tsx`: Form functionality and calculations
- `EcoFeatureTemplates.test.tsx`: Template application and pricing
- `QuoteVersionHistory.test.tsx`: Timeline display and status tracking
- `QuoteManagement.test.tsx`: Integration testing for complete workflows

### Running Tests

```bash
# Run all quote tests
npm test -- quotes

# Run specific test file
npm test -- QuoteBuilderForm.test.tsx

# Run integration tests
npm test -- QuoteManagement.test.tsx
```

## Usage Workflows

### Creating a New Quote

1. **Navigate to Quote Builder**: `/quotes/new`
2. **Select Build Request**: Choose from available customer requests
3. **Add Line Items**: Use the quote builder to add construction items
4. **Apply Eco-Templates**: Use pre-built templates for common eco-features
5. **Review Totals**: Verify calculations with Ghana regional pricing
6. **Add Notes/Terms**: Include internal notes and customer terms
7. **Create Quote**: Submit the quote for customer review

### Managing Existing Quotes

1. **View Quote List**: Navigate to `/quotes`
2. **Filter by Status**: Use status filter to find specific quotes
3. **View Details**: Click on quote to see full details
4. **Take Actions**: Send, accept, decline, or modify quotes
5. **Track Progress**: Monitor quote timeline and status changes

### Sending Quotes to Customers

1. **Review Quote**: Ensure all details are correct
2. **Send Quote**: Click "Send to Customer" button
3. **Customer Notification**: System automatically emails customer
4. **Track Status**: Monitor when customer views/responds to quote
5. **Follow Up**: Take appropriate actions based on customer response

## Best Practices

### Quote Creation

- **Use Templates**: Start with eco-feature templates for consistency
- **Regional Pricing**: Always apply appropriate regional multipliers
- **Clear Descriptions**: Use descriptive line item labels
- **Sustainability Focus**: Highlight eco-features and benefits
- **Ghana Context**: Include local considerations and regulations

### Customer Communication

- **Clear Terms**: Use understandable terms and conditions
- **Pricing Transparency**: Break down costs clearly
- **Eco-Benefits**: Emphasize sustainability advantages
- **Local Relevance**: Reference Ghana-specific benefits and incentives
- **Timely Follow-up**: Respond promptly to customer inquiries

### Quote Management

- **Regular Updates**: Keep quote status current
- **Version Control**: Track all quote modifications
- **Documentation**: Maintain clear internal notes
- **Timeline Tracking**: Monitor quote progression
- **Customer Service**: Provide excellent support throughout process

## Troubleshooting

### Common Issues

1. **Regional Multiplier Not Applied**
   - Check that "Apply regional multiplier" is enabled for line items
   - Verify regional multiplier value is correct for the area

2. **Currency Formatting Issues**
   - Ensure currency code is set to "GHS"
   - Check browser locale settings for number formatting

3. **Template Application Problems**
   - Verify eco-features are available in the selected region
   - Check that template features are compatible with build request

4. **Quote Status Not Updating**
   - Refresh the page to get latest status
   - Check network connectivity for real-time updates
   - Verify user permissions for status changes

### Support

For technical issues or feature requests related to the quote management system:

1. Check the test files for expected behavior
2. Review the API documentation for endpoint details
3. Consult the component documentation for usage examples
4. Contact the development team for additional support

## Future Enhancements

### Planned Features

- **PDF Generation**: Direct PDF export of quotes
- **Email Templates**: Customizable email templates for quote sending
- **Approval Workflows**: Multi-step approval process for large quotes
- **Integration with Accounting**: Direct integration with accounting systems
- **Mobile Optimization**: Enhanced mobile experience for field agents
- **Offline Support**: Offline quote creation and synchronization

### Ghana Market Expansion

- **Additional Regions**: Support for more Ghana regions and cities
- **Local Partnerships**: Integration with local suppliers and contractors
- **Government Incentives**: Automated calculation of available incentives
- **Regulatory Compliance**: Built-in compliance checking for local regulations
- **Language Support**: Multi-language support for local languages