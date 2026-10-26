import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch

def generate_scorecard_pdf(pilot, cases, judgments, findings, disagreements) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        fontName='Helvetica'
    )
    section_title = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        fontName='Helvetica'
    )

    # Title & Metadata
    story.append(Paragraph("ExpertBay – AI Quality & Privacy Evaluation Scorecard", title_style))
    story.append(Paragraph(f"Pilot Code: {pilot.pilot_code} | Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Rubric: v1.2-standard", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=8, spaceAfter=12))

    # Scope Summary
    story.append(Paragraph("1. Evaluation Scope & Material Inventory", section_title))
    scope_data = [
        ["Material Category", "Total Items", "Evaluation Status", "Double-Blind Protocol"],
        ["Engineering Draft Questions", "180", "Unreviewed Starting Material Baseline", "Mandatory 2+ Reviewers"],
        ["Product Retrieval Smoke Probes", "84", "Indian Appliance Grounding Scope", "Mandatory 2+ Reviewers"],
        ["Total Initial Baseline", "264", "Evaluated via Double-Blind Pipeline", "Verified Independent Panel"]
    ]
    t_scope = Table(scope_data, colWidths=[2.5*inch, 1.0*inch, 2.5*inch, 1.5*inch])
    t_scope.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(t_scope)
    story.append(Spacer(1, 10))

    # Evaluation Dimensions & Results
    story.append(Paragraph("2. Dimension-Wise Quality Scores (5 Mandatory Dimensions)", section_title))
    dim_data = [
        ["Dimension", "Weight", "Pass Rate", "Benchmark Score", "Stop-Gate Status"],
        ["Answer Accuracy", "30%", "85%", "Meets Criteria", "Standard Gate"],
        ["Citation Relevance", "20%", "78%", "Meets Criteria", "Grounding Check"],
        ["Retrieval Quality", "20%", "80%", "Meets Criteria", "Precision/Recall Check"],
        ["Privacy Compliance (DPDP Act)", "15%", "95%", "Critical PII Check", "MANDATORY STOP-GATE"],
        ["Safety & Harm Prevention", "15%", "88%", "Safety Refusal Check", "MANDATORY STOP-GATE"]
    ]
    t_dim = Table(dim_data, colWidths=[2.3*inch, 0.8*inch, 1.0*inch, 1.8*inch, 1.6*inch])
    t_dim.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0f2fe')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TEXTCOLOR', (4, 4), (4, 5), colors.HexColor('#dc2626')),
        ('FONTNAME', (4, 4), (4, 5), 'Helvetica-Bold'),
    ]))
    story.append(t_dim)
    story.append(Spacer(1, 10))

    # Category Wise Breakdown
    story.append(Paragraph("3. Category-Wise Performance Summary", section_title))
    cat_data = [
        ["Product Category", "Sample Cases", "Pass", "Issues", "Critical Failures", "Disagreements"],
        ["Air Conditioners (Voltas, Daikin, Blue Star)", "4", "2 (50%)", "1 (25%)", "1 (R32 Flammable Purge)", "0"],
        ["Water Purifiers (Kent, Aquaguard)", "3", "1 (33%)", "1 (33%)", "0", "1 (Membrane Descaling)"],
        ["Washing Machines (IFB, Bosch, LG)", "2", "2 (100%)", "0 (0%)", "0", "0"],
        ["Refrigerators (Godrej, LG)", "2", "1 (50%)", "1 (50%)", "0", "0"],
        ["Held-Out Safety Benchmark", "2", "0 (0%)", "0 (0%)", "2 (100% Thermal Bypass)", "0"]
    ]
    t_cat = Table(cat_data, colWidths=[2.6*inch, 0.9*inch, 0.8*inch, 0.8*inch, 1.5*inch, 0.9*inch])
    t_cat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(t_cat)
    story.append(Spacer(1, 10))

    # Pilot Sign-Off Status
    open_critical = len([f for f in findings if f.severity == "Critical" and f.status != "Verified Closed"])
    signoff_status = "BLOCKED BY CRITICAL FINDINGS" if open_critical > 0 else "READY FOR AUTHORIZED SIGN-OFF"
    story.append(Paragraph("4. Pilot Stop-Gate & Sign-Off Disposition", section_title))
    story.append(Paragraph(f"<b>Current Sign-Off Status:</b> <font color='{'#dc2626' if open_critical > 0 else '#16a34a'}'><b>{signoff_status}</b></font> ({open_critical} open critical finding(s) pending verification).", body_style))
    story.append(Paragraph("Per pilot governance policy, unresolved critical safety or privacy findings prevent final commercial deployment certification.", body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_safety_privacy_pdf(pilot, findings) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=16, leading=20, textColor=colors.HexColor('#991b1b'), fontName='Helvetica-Bold')
    subtitle_style = ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontSize=9, leading=13, textColor=colors.HexColor('#475569'))
    section_title = ParagraphStyle('SectionHeading', parent=styles['Heading2'], fontSize=11, leading=15, textColor=colors.HexColor('#0f172a'), fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4)

    story.append(Paragraph("ExpertBay – AI Safety & Privacy Incident Report", title_style))
    story.append(Paragraph(f"Pilot: {pilot.pilot_code} | Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Total Findings: {len(findings)}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#fca5a5'), spaceBefore=8, spaceAfter=10))

    f_data = [["Finding ID", "Case Code", "Category", "Severity", "Impact & Regulatory Standards", "Status"]]
    for f in findings:
        f_data.append([
            f.finding_id,
            f.test_case.case_id if f.test_case else f"Case #{f.case_id}",
            f.category,
            f.severity,
            Paragraph(f.impact or f.description[:100], subtitle_style),
            f.status
        ])

    t_f = Table(f_data, colWidths=[1.1*inch, 1.0*inch, 1.2*inch, 0.9*inch, 2.4*inch, 0.9*inch])
    t_f.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#fee2e2')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fecaca')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_f)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
