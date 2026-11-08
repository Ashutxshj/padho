import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# --- 1. Generate Architecture Diagram ---
def generate_diagram(output_path):
    fig, ax = plt.subplots(figsize=(12, 7.2), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7.2)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # Title
    ax.text(6, 6.8, 'BookLeaf Publishing — Author Royalty & Automation Architecture', 
            fontsize=15, fontweight='bold', ha='center', va='center', color='#0F172A', fontfamily='sans-serif')

    # Left Container: Bubble.io Tier
    bubble_box = patches.FancyBboxPatch((0.5, 0.5), 5.1, 5.9, boxstyle='round,pad=0.15', 
                                        facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.5)
    ax.add_patch(bubble_box)
    ax.text(3.05, 6.1, 'Bubble.io Application Tier', fontsize=12, fontweight='bold', ha='center', color='#1E293B')

    # Author Portal Card
    p1 = patches.FancyBboxPatch((0.8, 4.6), 4.5, 1.2, boxstyle='round,pad=0.1', facecolor='#F1F5F9', edgecolor='#94A3B8')
    ax.add_patch(p1)
    ax.text(0.95, 5.5, 'Author Portal (/author_dashboard)', fontsize=9.5, fontweight='bold', color='#334155')
    ax.text(0.95, 5.15, '• Royalty Balance Sheet (Earned, Paid, Pending)', fontsize=8, color='#475569')
    ax.text(0.95, 4.85, '• 3-Color Dynamic Badge (Green / Yellow / Red)', fontsize=8, color='#475569')

    # Admin Portal Card
    p2 = patches.FancyBboxPatch((0.8, 3.0), 4.5, 1.4, boxstyle='round,pad=0.1', facecolor='#F1F5F9', edgecolor='#94A3B8')
    ax.add_patch(p2)
    ax.text(0.95, 4.15, 'Admin Operations Console (/admin_dashboard)', fontsize=9.5, fontweight='bold', color='#334155')
    ax.text(0.95, 3.85, '• Directory Table with City and Status Dropdown Filters', fontsize=8, color='#475569')
    ax.text(0.95, 3.55, '• Author Detail and Books Catalog Breakdown', fontsize=8, color='#475569')
    ax.text(0.95, 3.25, '• Action: "Generate and Send Royalty Summary" Button', fontsize=8, fontweight='bold', color='#2563EB')

    # Bubble Database Card
    p3 = patches.FancyBboxPatch((0.8, 0.8), 4.5, 2.0, boxstyle='round,pad=0.1', facecolor='#F8FAFC', edgecolor='#CBD5E1')
    ax.add_patch(p3)
    ax.text(0.95, 2.55, 'Bubble Relational DB and Privacy Engine', fontsize=9.5, fontweight='bold', color='#334155')
    ax.text(0.95, 2.25, '• Author (author_id, cached totals, payout status)', fontsize=8, color='#475569')
    ax.text(0.95, 1.95, '• Book (mrp, sales, royalty split, payout dates)', fontsize=8, color='#475569')
    ax.text(0.95, 1.65, '• User (role: admin / author, author_profile link)', fontsize=8, color='#475569')
    ax.text(0.95, 1.35, '• Notification_Log (audit status, generated summary)', fontsize=8, color='#475569')
    ax.text(0.95, 1.05, '• Strict Privacy Rules: author_profile isolation', fontsize=7.5, fontstyle='italic', color='#059669')

    # Right Container: n8n Automation Engine
    n8n_box = patches.FancyBboxPatch((6.4, 0.5), 5.1, 5.9, boxstyle='round,pad=0.15', 
                                     facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.5)
    ax.add_patch(n8n_box)
    ax.text(8.95, 6.1, 'n8n Cloud Automation Engine', fontsize=12, fontweight='bold', ha='center', color='#EA580C')

    # Node 1 & 2
    n1 = patches.FancyBboxPatch((6.7, 4.8), 4.5, 1.0, boxstyle='round,pad=0.1', facecolor='#FEF2F2', edgecolor='#FCA5A5')
    ax.add_patch(n1)
    ax.text(6.85, 5.55, '1. Webhook Receiver and 2. Security Check', fontsize=9, fontweight='bold', color='#991B1B')
    ax.text(6.85, 5.25, '• POST /webhook/bookleaf-royalty', fontsize=8, color='#7F1D1D')
    ax.text(6.85, 4.95, '• Header Check: x-bookleaf-api-key validation', fontsize=8, color='#7F1D1D')

    # Node 3
    n2 = patches.FancyBboxPatch((6.7, 3.5), 4.5, 1.1, boxstyle='round,pad=0.1', facecolor='#EFF6FF', edgecolor='#BFDBFE')
    ax.add_patch(n2)
    ax.text(6.85, 4.35, '3. Data and Invariants Formatter (Code Node)', fontsize=9, fontweight='bold', color='#1E40AF')
    ax.text(6.85, 4.05, '• Parse Author and Book entities, aggregate figures', fontsize=8, color='#1E3A8A')
    ax.text(6.85, 3.75, '• Apply INR 1,000 threshold and quarterly rollover rules', fontsize=8, color='#1E3A8A')

    # Node 4 & 5
    n3 = patches.FancyBboxPatch((6.7, 2.0), 4.5, 1.3, boxstyle='round,pad=0.1', facecolor='#F0FDF4', edgecolor='#BBF7D0')
    ax.add_patch(n3)
    ax.text(6.85, 3.05, '4 and 5. Google Gemini AI Grounded Prompt', fontsize=9, fontweight='bold', color='#166534')
    ax.text(6.85, 2.75, '• Model: gemini-1.5-flash (Zero Hallucination Policy)', fontsize=8, color='#14532D')
    ax.text(6.85, 2.45, '• Policy: 80% author split, 45-day quarterly cycle', fontsize=8, color='#14532D')
    ax.text(6.85, 2.15, '• Synthesizes book breakdown and personal signoff', fontsize=8, color='#14532D')

    # Node 6
    n4 = patches.FancyBboxPatch((6.7, 0.8), 4.5, 1.0, boxstyle='round,pad=0.1', facecolor='#FAF5FF', edgecolor='#E9D5FF')
    ax.add_patch(n4)
    ax.text(6.85, 1.55, '6. Respond to Webhook (JSON Response)', fontsize=9, fontweight='bold', color='#6B21A8')
    ax.text(6.85, 1.25, '• Synchronous 200 OK with generated_summary', fontsize=8, color='#581C87')
    ax.text(6.85, 0.95, '• Bypasses Bubble Free backend paywall cleanly', fontsize=8, color='#581C87')

    # Arrows between Tiers
    ax.annotate('', xy=(6.55, 3.9), xytext=(5.75, 3.9),
                arrowprops=dict(arrowstyle='->', lw=2.2, color='#2563EB'))
    ax.text(6.15, 4.15, 'POST Trigger', fontsize=8, fontweight='bold', ha='center', color='#2563EB')

    ax.annotate('', xy=(5.75, 1.3), xytext=(6.55, 1.3),
                arrowprops=dict(arrowstyle='->', lw=2.2, color='#16A34A'))
    ax.text(6.15, 1.55, 'Synchronous Result', fontsize=8, fontweight='bold', ha='center', color='#16A34A')

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Diagram saved to {output_path}")

# Helper for Word table cell background shading
def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

# --- 2. Generate Word Document (.docx) ---
def build_docx(doc_path, image_path):
    doc = Document()
    
    # Page setup - 0.8 inch margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles & Fonts
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_brand = title_p.add_run("BOOKLEAF PUBLISHING — TECHNICAL ASSIGNMENT 2\n")
    run_brand.font.name = 'Calibri'
    run_brand.font.size = Pt(10)
    run_brand.font.bold = True
    run_brand.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)

    run_title = title_p.add_run("Author Royalty Dashboard & Automated Notification System")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_after = Pt(14)
    run_sub = subtitle_p.add_run("Technical Documentation, Architecture Specification & Learning Process")
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Metadata Callout Box
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.cell(0, 0)
    set_cell_shading(meta_cell, 'F1F5F9')
    set_cell_margins(meta_cell, top=140, bottom=140, left=200, right=200)
    meta_p = meta_cell.paragraphs[0]
    meta_p.paragraph_format.space_after = Pt(0)
    m1 = meta_p.add_run("Candidate: ")
    m1.bold = True
    meta_p.add_run("Ashutosh\t\t")
    m2 = meta_p.add_run("Tech Stack: ")
    m2.bold = True
    meta_p.add_run("Bubble.io + n8n Cloud + Google Gemini AI\n")
    m3 = meta_p.add_run("Live Admin Portal: ")
    m3.bold = True
    meta_p.add_run("Bubble Version-Test (admin_dashboard)\t\t")
    m4 = meta_p.add_run("Evaluation Target: ")
    m4.bold = True
    meta_p.add_run("musavir@bookleafpub.in\n")
    m5 = meta_p.add_run("Live n8n Webhook: ")
    m5.bold = True
    meta_p.add_run("https://sweetsalt.app.n8n.cloud/webhook/bookleaf-royalty")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Heading 1: Executive Summary & Architecture
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)
    r = h1.add_run("1. Executive Architecture & End-to-End Flow")
    r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_intro = doc.add_paragraph()
    p_intro.add_run(
        "This project delivers an enterprise-grade prototype for BookLeaf Publishing's author operations. "
        "The system pairs a visual Bubble.io front-end and relational database with an event-driven n8n automation "
        "workflow powered by Google Gemini AI. It provides multi-tenant author isolation, dynamic 3-color disbursement status "
        "tracking (Green, Yellow, Red), real-time author search and city filtering, and zero-hallucination AI royalty email drafting."
    )

    # Embed Architecture Diagram Image
    if os.path.exists(image_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(image_path, width=Inches(6.6))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(10)
        rc = p_cap.add_run("Figure 1: Full-Stack Architecture — Bubble.io Presentation & DB with n8n Cloud Automation")
        rc.font.size = Pt(8.5)
        rc.font.italic = True
        rc.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Heading 2: Bubble Database Schema
    h2 = doc.add_heading(level=1)
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(4)
    r2 = h2.add_run("2. Bubble Database Schema & Structural Rationale")
    r2.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_paragraph(
        "Bubble does not use traditional SQL DDL tables; entities and fields are modeled as Data Types. "
        "Rather than storing unstructured JSON or flat text, the database is normalized into four distinct entities "
        "with bidirectional relational links and strategic denormalization for high-throughput UI queries."
    )

    # Schema Table
    table = doc.add_table(rows=5, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ["Data Type", "Key Fields & Relationships", "Architectural Rationale"]
    hdr_widths = [Inches(1.2), Inches(2.6), Inches(2.8)]

    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.width = hdr_widths[i]
        set_cell_shading(cell, '1E293B')
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(h)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(9.5)

    data = [
        ("Author", 
         "author_id (text), name, email, phone, city, joined_date, cached_total_earned, cached_total_paid, cached_total_pending, cached_payout_status.", 
         "Stores pre-calculated royalty aggregates on the Author record to allow instantaneous client-side sorting, city filtering, and badge rendering without expensive N+1 nested calculations in repeating groups."),
        ("Book", 
         "book_id, author (Author link), title, isbn, genre, status, publication_date, mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned, royalty_paid, royalty_pending, last_royalty_payout_date.", 
         "1-to-many relationship with Author. Handles production stages (e.g. 'In Production - Cover Design') where ISBN/dates are pending. Encapsulates itemized contractual royalties per title."),
        ("User", 
         "email, role ('admin' | 'author'), author_profile (Author link).", 
         "Separates authentication accounts from domain author records. Facilitates 1-to-1 linking for Author Self-Access privacy rules and multi-role access control."),
        ("Notification_Log", 
         "author (Author link), trigger_type ('manual'), status ('Success' | 'Failed'), trigger_timestamp, completion_timestamp, generated_summary, error_message, idempotency_key.", 
         "Immutable audit ledger capturing every AI notification dispatch. Logs Gemini's complete generated email text and failure diagnostics directly against the author profile.")
    ]

    for row_idx, (col1, col2, col3) in enumerate(data, start=1):
        bg = 'F8FAFC' if row_idx % 2 == 1 else 'FFFFFF'
        for col_idx, text_val in enumerate([col1, col2, col3]):
            cell = table.cell(row_idx, col_idx)
            cell.width = hdr_widths[col_idx]
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text_val)
            run.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Privacy Rules Sub-section
    p_priv = doc.add_paragraph()
    r_pt = p_priv.add_run("Security & Privacy Rule Architecture:\n")
    r_pt.bold = True
    p_priv.add_run(
        "Bubble Privacy Rules are strictly enforced at the database query level:\n"
        "• Author Rule: Current User's role is 'admin' (Full Read/Search) | Current User's author_profile is This Author (Self Read) | Everyone else: Blocked.\n"
        "• Book Rule: Current User's role is 'admin' (Full Read) | Current User's author_profile is This Book's author (Self Read) | Everyone else: Blocked.\n"
        "This completely prevents multi-tenant data leakage: authors cannot view peers' catalogs or financial balances even via inspect tools."
    )

    # Heading 3: Bubble ↔ n8n Integration
    h3 = doc.add_heading(level=1)
    h3.paragraph_format.space_before = Pt(12)
    h3.paragraph_format.space_after = Pt(4)
    r3 = h3.add_run("3. Bubble ↔ n8n Integration & Synchronous Callback Architecture")
    r3.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_paragraph(
        "The integration between Bubble.io and n8n operates over HTTPS using Bubble's official API Connector plugin. "
        "The workflow contract is engineered for high reliability, strict authentication, and sub-second execution:"
    )

    doc.add_paragraph(
        "1. Outgoing Webhook Trigger: When an administrator clicks 'Generate & Send Royalty Summary' in the operations console, "
        "Bubble fires a POST request to https://sweetsalt.app.n8n.cloud/webhook/bookleaf-royalty carrying the author metadata, "
        "cached financial totals, and itemized catalog records.\n"
        "2. Header Security Verification: The request carries an enterprise security header (x-bookleaf-api-key: bk_live_sec_89f02c78a1bc402). "
        "Node 2 in n8n enforces this check; requests missing or with invalid keys are immediately rejected with HTTP 401.\n"
        "3. Synchronous Response Design: Rather than relying on asynchronous incoming HTTP callbacks (which are restricted under "
        "Bubble's free tier Workflow API), n8n uses the 'Respond to Webhook' node. The generated email is passed directly back in the HTTP response body.\n"
        "4. Audit Ledger Ingestion: Bubble's frontend workflow receives { status: 'Success', generated_summary: '...' } in Step 5 and commits "
        "it directly into Notification_Log, instantly rendering the full email in the operations audit table."
    )

    # Heading 4: AI Prompt Engineering Strategy
    h4 = doc.add_heading(level=1)
    h4.paragraph_format.space_before = Pt(12)
    h4.paragraph_format.space_after = Pt(4)
    r4 = h4.add_run("4. AI Prompt Strategy & Zero-Hallucination Policy")
    r4.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_paragraph(
        "The AI node utilizes Google Gemini (gemini-1.5-flash) governed by a rigorous Prompt Strategy designed to prevent "
        "financial hallucinations and enforce BookLeaf's formal publishing agreements:"
    )

    prompt_box = doc.add_table(rows=1, cols=1)
    prompt_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    p_cell = prompt_box.cell(0, 0)
    set_cell_shading(p_cell, 'F8FAFC')
    set_cell_margins(p_cell, top=120, bottom=120, left=160, right=160)
    pp = p_cell.paragraphs[0]
    pp.paragraph_format.space_after = Pt(0)
    r_pk = pp.add_run("Core Knowledge Base Policy Injected into Prompt:\n")
    r_pk.bold = True
    pp.add_run(
        "1. Royalty Split: 80% net profit to author, 20% to BookLeaf Publishing.\n"
        "2. Settlement Cycle: Calculated quarterly; disbursed via direct bank transfer within 45 calendar days following quarter close.\n"
        "3. Threshold Invariants:\n"
        "   - Pending >= ₹1,000: Scheduled for the upcoming quarterly payout run.\n"
        "   - Pending < ₹1,000: Automatically rolled over to subsequent quarter without fees.\n"
        "   - Pending = ₹0: Account marked as fully settled.\n"
        "4. Unreleased Titles: Titles in Production (Cover Design / Typesetting) report status without fictitious sales numbers.\n"
        "5. Zero Hallucination: Grounded strictly on verified payload data; no invented reference numbers, bank names, or arbitrary disbursement dates."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Heading 5: Error Handling Approach
    h5 = doc.add_heading(level=1)
    h5.paragraph_format.space_before = Pt(12)
    h5.paragraph_format.space_after = Pt(4)
    r5 = h5.add_run("5. Multi-Layered Error Handling Approach")
    r5.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_paragraph(
        "To ensure production resilience, defensive mechanisms were established at every layer of the architecture:\n"
        "• Bubble API Connector Resilience: Enabled 'Include errors in response and allow workflow actions to continue'. This prevents unhandled client exceptions.\n"
        "• Dual-Branch Workflow Logic: Step 3 and Step 4 trigger only when 'Result of Step 2's returned_an_error is yes' (sets Notification_Log status to Failed, logs error status message, and triggers red Error Alert). Step 5 and Step 6 trigger when 'returned_an_error is no' (commits Success and displays OK Alert).\n"
        "• Security Gatekeeping: Unauthorized calls lacking x-bookleaf-api-key are intercepted in n8n before invoking the LLM, eliminating unnecessary AI compute costs.\n"
        "• JSON Payload Sanitization: Code Node 3 normalizes nested objects and escapes line breaks to prevent JSON parsing errors."
    )

    # Heading 6: Learning Process & Challenges Faced
    h6 = doc.add_heading(level=1)
    h6.paragraph_format.space_before = Pt(12)
    h6.paragraph_format.space_after = Pt(4)
    r6 = h6.add_run("6. Technical Challenges Faced & Learning Process")
    r6.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_paragraph(
        "Coming from conventional full-stack software development (React, Next.js, Python, PostgreSQL), building in Bubble.io and n8n "
        "provided valuable insights into visual programming paradigms and platform constraints:"
    )

    challenges = [
        ("Bubble CSV Upload Tier Restrictions", 
         "Bubble recently restricted the native CSV bulk uploader behind the paid Starter tier. Rather than upgrading or compromising the schema, we seeded four representative test authors and six books manually. These four authors comprehensively covered all 3 badge states (Green fully paid, Yellow pending, and both Red overdue edge cases: published >90 days never paid, and last payout >90 days)."),
        ("Overcoming Bubble Free Backend Workflow Paywalls", 
         "Bubble Free disables incoming backend workflow webhooks (/api/1.1/wf/...). A traditional async callback from n8n returned HTTP 401 Unauthorized. To solve this architecturally without requiring paid upgrades, we re-engineered the n8n pipeline to use the synchronous 'Respond to Webhook' node. Bubble receives the generated email in the HTTP response payload, rendering it in the UI and saving it to the database with zero latency."),
        ("Visual Dynamic Expression Builder", 
         "Unlike code where object lookups are written as user.role === 'admin', Bubble requires constructing expressions via chained dropdowns (Current User's role is 'admin'). Initial attempts to type string comparisons caused 'No results found' errors until mastering Bubble's strict visual AST parser."),
        ("AI Grounding & Cost Optimization", 
         "Connecting personal OpenAI keys encountered rate limit/credit restrictions (HTTP 429). We seamlessly pivoted to Google Gemini (gemini-1.5-flash), re-calibrating prompt temperature to 0.2 to achieve deterministic, factually bulletproof summaries with zero hallucination.")
    ]

    for title, desc in challenges:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        run_t = p.add_run(f"• {title}: ")
        run_t.bold = True
        run_t.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        p.add_run(desc)

    # Verification Table
    h7 = doc.add_heading(level=1)
    h7.paragraph_format.space_before = Pt(12)
    h7.paragraph_format.space_after = Pt(4)
    r7 = h7.add_run("7. Test Matrix & Rule Verification")
    r7.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    v_table = doc.add_table(rows=5, cols=4)
    v_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    v_table.autofit = False

    v_hdrs = ["Test Case", "Author / Scenario", "Expected Badge & Rule", "Observed System Output"]
    v_widths = [Inches(0.9), Inches(1.8), Inches(2.2), Inches(1.7)]

    for i, h in enumerate(v_hdrs):
        cell = v_table.cell(0, i)
        cell.width = v_widths[i]
        set_cell_shading(cell, '1E293B')
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(h)
        run.bold = True
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.size = Pt(9)

    v_data = [
        ("TC-01", "Farhan Sheikh (AUTH008)", "Green: Fully Paid (Pending = 0)", "Green badge; ₹3,120 earned, ₹3,120 paid, ₹0 pending."),
        ("TC-02", "Priya Sharma (AUTH001)", "Yellow: Pending in cycle", "Yellow badge; ₹19,908 earned, ₹16,338 paid, ₹3,570 pending."),
        ("TC-03", "Ananya Reddy (AUTH003)", "Red: Published >90 days, never paid", "Red badge; ₹2,546 pending, zero historical payouts."),
        ("TC-04", "Vikram Joshi (AUTH004)", "Red: Last payout >90 days ago", "Red badge; ₹3,350 pending, last payout Aug 20, 2025.")
    ]

    for row_idx, (col1, col2, col3, col4) in enumerate(v_data, start=1):
        bg = 'F8FAFC' if row_idx % 2 == 1 else 'FFFFFF'
        for col_idx, text_val in enumerate([col1, col2, col3, col4]):
            cell = v_table.cell(row_idx, col_idx)
            cell.width = v_widths[col_idx]
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text_val)
            run.font.size = Pt(8.5)

    doc.save(doc_path)
    print(f"Word document successfully saved to {doc_path}")

if __name__ == '__main__':
    base_dir = r"c:\Users\Ashut\OneDrive\Desktop\Projects\padho\assignment2"
    img_path = os.path.join(base_dir, "architecture_diagram.png")
    doc_path = os.path.join(base_dir, "BookLeaf_Assignment_2_Documentation.docx")
    
    generate_diagram(img_path)
    build_docx(doc_path, img_path)
