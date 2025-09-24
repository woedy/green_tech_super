"""
Document generation for construction requests.
Generates PDF specifications and other documents for construction projects.
"""
import os
from io import BytesIO
from datetime import datetime
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.templatetags.static import static
from xhtml2pdf import pisa
from weasyprint import HTML, CSS
from construction.models import ConstructionRequest, ConstructionRequestEcoFeature
from construction.ghana.models import GhanaRegion


def generate_specification_document(construction_request):
    """
    Generate a PDF specification document for a construction request.
    
    Args:
        construction_request (ConstructionRequest): The construction request to generate a document for.
        
    Returns:
        BytesIO: A file-like object containing the generated PDF.
    """
    # Get related data
    eco_features = construction_request.selected_eco_features.all()
    
    # Calculate total estimated cost
    total_cost = construction_request.estimated_cost or 0
    
    # Get region data for multipliers if available
    region = None
    if construction_request.region:
        try:
            region = GhanaRegion.objects.get(name=construction_request.region)
        except GhanaRegion.DoesNotExist:
            pass
    
    # Prepare context for template
    context = {
        'request': construction_request,
        'eco_features': eco_features,
        'total_cost': total_cost,
        'region': region,
        'generated_date': timezone.now().strftime('%B %d, %Y'),
        'logo_url': static('img/logo.png'),
    }
    
    # Render HTML template
    html_string = render_to_string('construction/specification_document.html', context)
    
    # Generate PDF
    pdf_file = BytesIO()
    
    # Using weasyprint for better CSS support
    html = HTML(string=html_string, base_url=settings.BASE_DIR)
    css = CSS(string='''
        @page {
            size: A4;
            margin: 2cm;
            @top-right {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10pt;
                color: #666;
            }
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
        h1, h2, h3 {
            color: #2E7D32;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .feature-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .feature-table th, .feature-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .feature-table th {
            background-color: #f2f2f2;
        }
        .cost-summary {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            font-size: 10pt;
            text-align: center;
            color: #666;
        }
    ''')
    
    html.write_pdf(pdf_file, stylesheets=[css])
    pdf_file.seek(0)
    
    return pdf_file


def generate_document_filename(construction_request, doc_type='specification'):
    """
    Generate a standardized filename for a construction document.
    
    Args:
        construction_request (ConstructionRequest): The construction request.
        doc_type (str): Type of document (e.g., 'specification', 'quote').
        
    Returns:
        str: A formatted filename.
    """
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    project_name = construction_request.title.replace(' ', '_').lower()
    return f"{project_name}_{doc_type}_{timestamp}.pdf"
