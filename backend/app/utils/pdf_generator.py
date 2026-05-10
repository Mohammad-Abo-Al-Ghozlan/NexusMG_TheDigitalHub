import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def generate_trainee_report_pdf(trainee, score, evaluations):
    """Generate a PDF report for a single trainee."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading2']
    subtitle_style.textColor = colors.HexColor("#333333")
    
    normal_style = styles['Normal']
    
    story = []
    
    # Title
    story.append(Paragraph("Trainee Performance Report", title_style))
    story.append(Spacer(1, 12))
    
    # Trainee Info
    story.append(Paragraph("Trainee Information", subtitle_style))
    info_data = [
        ["Full Name:", trainee.full_name or "N/A"],
        ["Email:", trainee.email],
        ["Role:", trainee.role.value.capitalize()],
        ["Joined Date:", trainee.created_at.strftime("%Y-%m-%d") if trainee.created_at else "N/A"]
    ]
    info_table = Table(info_data, colWidths=[100, 300])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#555555")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    # Readiness Score
    story.append(Paragraph("Readiness Scores", subtitle_style))
    if score:
        score_data = [
            ["Overall Readiness:", f"{score.overall_score}%"],
            ["CV Score:", f"{score.cv_score}%"],
            ["GitHub Score:", f"{score.github_score}%"],
            ["LinkedIn Score:", f"{score.linkedin_score}%"],
            ["Idea Score:", f"{score.idea_score}%"],
            ["Interview Score:", f"{score.interview_score}%"],
            ["English Score:", f"{score.english_score}%"],
        ]
        score_table = Table(score_data, colWidths=[150, 100])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#dddddd")),
        ]))
        story.append(score_table)
    else:
        story.append(Paragraph("No readiness scores available.", normal_style))
        
    story.append(Spacer(1, 20))
    
    # Evaluations
    story.append(Paragraph("Evaluation History", subtitle_style))
    if evaluations:
        eval_data = [["Module", "Score", "Date", "Feedback"]]
        for e in evaluations:
            feedback_text = (e.feedback[:50] + '...') if e.feedback and len(e.feedback) > 50 else (e.feedback or "N/A")
            eval_data.append([
                e.evaluation_type.value.capitalize(),
                f"{e.score}%" if e.score is not None else "N/A",
                e.created_at.strftime("%Y-%m-%d") if e.created_at else "N/A",
                feedback_text
            ])
            
        eval_table = Table(eval_data, colWidths=[80, 60, 80, 240])
        eval_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e0e0e0")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cccccc")),
        ]))
        story.append(eval_table)
    else:
        story.append(Paragraph("No evaluations completed yet.", normal_style))
        
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer

def generate_all_trainees_report_pdf(trainees_data):
    """Generate a PDF report for a list of trainees."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=72, bottomMargin=36)
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    story = []
    
    # Title
    story.append(Paragraph("Trainees Overview Report", title_style))
    story.append(Spacer(1, 12))
    
    # Table data
    data = [["Name", "Email", "Readiness Score", "Last Active"]]
    
    for t in trainees_data:
        data.append([
            t['full_name'] or "N/A",
            t['email'],
            f"{t['readiness_score']}%",
            t['last_active']
        ])
        
    table = Table(data, colWidths=[150, 200, 100, 90])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0284c7")), # Theme primary color
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#dddddd")),
    ]))
    
    story.append(table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
