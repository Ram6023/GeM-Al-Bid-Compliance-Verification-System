import os
import logging
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.core.config import settings

logger = logging.getLogger("report_gen")

class PDFReportGenerator:
    @staticmethod
    def generate_compliance_report(bid_data: dict, results: list) -> str:
        """
        Generates a professional GeM AI Bid Compliance Audit PDF Report.
        Returns the absolute filepath to the generated PDF.
        """
        filename = f"GeM_Bid_Audit_{bid_data['bid_number']}.pdf"
        filepath = os.path.join(settings.REPORTS_DIR, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4B5563'),
            spaceAfter=15
        )
        cell_header_style = ParagraphStyle('CellHeader', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', textColor=colors.white)
        cell_body_style = ParagraphStyle('CellBody', parent=styles['Normal'], fontSize=8, leading=10)

        elements = []

        # Title
        elements.append(Paragraph("GeM AI Bid Compliance Verification System", title_style))
        elements.append(Paragraph(f"<b>Audit Report for Bid No:</b> {bid_data['bid_number']} | <b>Generated:</b> Automated AI Audit", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=15))

        # Executive Summary Box
        summary_text = f"""
        <b>Tender Title:</b> {bid_data['tender_title']}<br/>
        <b>Bidder Name:</b> {bid_data['bidder_name']}<br/>
        <b>Overall Compliance Score:</b> <font color="{'green' if bid_data['compliance_score']>=80 else 'red'}"><b>{bid_data['compliance_score']}%</b></font><br/>
        <b>Risk Level:</b> <b>{bid_data['risk_level']} RISK</b><br/>
        <b>Audit Breakdown:</b> Passed {bid_data['passed_clauses']}/{bid_data['total_clauses']} | Failed {bid_data['failed_clauses']} | Needs Review {bid_data['warning_clauses']}
        """
        summary_p = Paragraph(summary_text, styles['Normal'])
        summary_table = Table([[summary_p]], colWidths=[540])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F3F4F6')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#D1D5DB')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 15))

        # Table Header
        table_data = [[
            Paragraph("Clause Code", cell_header_style),
            Paragraph("Category", cell_header_style),
            Paragraph("Requirement & Evaluation", cell_header_style),
            Paragraph("Status", cell_header_style),
            Paragraph("Page & Source", cell_header_style)
        ]]

        for r in results:
            status_color = "#16A34A" if r['status'] == "COMPLIANT" else ("#DC2626" if r['status'] == "NON_COMPLIANT" else "#D97706")
            status_p = Paragraph(f"<font color='{status_color}'><b>{r['status']}</b></font>", cell_body_style)
            
            req_p = Paragraph(f"<b>{r['clause_title']}</b><br/>{r['tender_requirement'][:150]}...<br/><br/><b>AI Rationale:</b> {r['ai_rationale']}", cell_body_style)
            source_p = Paragraph(f"Doc: {r['source_doc_name']}<br/>Page: {r['page_number']}", cell_body_style)

            table_data.append([
                Paragraph(r['clause_code'], cell_body_style),
                Paragraph(r['category'], cell_body_style),
                req_p,
                status_p,
                source_p
            ])

        col_widths = [70, 75, 235, 75, 85]
        results_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        results_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))

        elements.append(results_table)

        doc.build(elements)
        return filepath
