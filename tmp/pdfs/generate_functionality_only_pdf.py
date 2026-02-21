from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

OUTPUT_PATH = "output/pdf/admin-hyriki-functionality-summary.pdf"

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.55 * inch
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN)


def wrap_text(text, font_name, font_size, max_width):
    words = text.split()
    if not words:
        return [""]
    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_paragraph(c, text, x, y, font_name="Helvetica", font_size=10.5, leading=13):
    lines = wrap_text(text, font_name, font_size, CONTENT_WIDTH)
    c.setFont(font_name, font_size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullet(c, text, x, y, font_size=10.2, leading=12.5):
    bullet_indent = x + 12
    lines = wrap_text(text, "Helvetica", font_size, CONTENT_WIDTH - 12)
    c.setFont("Helvetica", font_size)
    for i, line in enumerate(lines):
        if i == 0:
            c.drawString(x, y, "- " + line)
        else:
            c.drawString(bullet_indent, y, line)
        y -= leading
    return y


def section_heading(c, title, x, y):
    c.setFont("Helvetica-Bold", 11.5)
    c.drawString(x, y, title)
    return y - 15


def main():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=letter)

    x = MARGIN
    y = PAGE_HEIGHT - MARGIN

    c.setFont("Helvetica-Bold", 18)
    c.drawString(x, y, "Admin Hyriki - Functionality Summary")
    y -= 20

    c.setFont("Helvetica", 9)
    c.drawString(x, y, "One-page summary focused on what the app does for users (no tech stack details).")
    y -= 22

    y = section_heading(c, "What this app is", x, y)
    y = draw_paragraph(
        c,
        "Admin Hyriki is an operations dashboard for school hiring teams. It centralizes job campaign execution, candidate progression, interview coordination, and hiring analytics in one workspace.",
        x,
        y,
    )
    y -= 8

    y = section_heading(c, "Primary users", x, y)
    y = draw_bullet(
        c,
        "School admins and recruiters who manage hiring pipelines for their organization.",
        x,
        y,
    )
    y = draw_bullet(c, "Named persona document: Not found in repo.", x, y)
    y -= 8

    y = section_heading(c, "Core functionality", x, y)
    bullets = [
        "Access and onboarding: sign up, log in, reset password, confirm account, and route users to select/create/join organization before dashboard use.",
        "Dashboard monitoring: view organization-level hiring KPIs, active campaign summaries, hiring progress, and weekly activity trends.",
        "Job operations: create job posts, manage job status, browse/filter/sort jobs, and open per-job detail and analytics views.",
        "Candidate workflow: review candidate lists, inspect application details, and move through assessment, panel review, and recommendation views.",
        "Assessment tracking: view job-level and candidate-level assessment outcomes, including video and MCQ related screens and analytics.",
        "Interview operations: view interview schedules, candidate interview context, and confirmation-related flows.",
        "Analytics and troubleshooting: analyze school metrics plus candidate-funnel friction, drop-off patterns, browser/device issues, and timeline events.",
        "Team and configuration controls: manage account details, users, school information, interview settings, notifications, and invitation management.",
    ]
    for b in bullets:
        y = draw_bullet(c, b, x, y)

    y -= 6
    y = section_heading(c, "Typical user journey", x, y)
    journey = [
        "1. Sign in and complete organization selection or setup.",
        "2. Open dashboard to assess current hiring pipeline health.",
        "3. Create or update job campaigns and review candidate inflow.",
        "4. Progress candidates through assessments and interview stages.",
        "5. Use analytics views to identify bottlenecks and improve conversion.",
    ]
    for j in journey:
        y = draw_bullet(c, j, x, y)

    c.setFont("Helvetica-Oblique", 8)
    c.drawString(
        x,
        MARGIN - 5,
        "Evidence source: repository pages, route structure, navigation labels, and product documentation under docs/.",
    )

    c.showPage()
    c.save()


if __name__ == "__main__":
    main()
