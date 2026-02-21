from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

OUTPUT_PATH = "output/pdf/admin-hyriki-app-summary.pdf"

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.5 * inch
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


def draw_paragraph(c, text, x, y, font_name="Helvetica", font_size=10, leading=12):
    lines = wrap_text(text, font_name, font_size, CONTENT_WIDTH)
    c.setFont(font_name, font_size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullet(c, text, x, y, font_size=10, leading=12):
    bullet = "- "
    bullet_indent = x + 12
    first_line_width = CONTENT_WIDTH - 12
    lines = wrap_text(text, "Helvetica", font_size, first_line_width)

    c.setFont("Helvetica", font_size)
    for idx, line in enumerate(lines):
        if idx == 0:
            c.drawString(x, y, bullet + line)
        else:
            c.drawString(bullet_indent, y, line)
        y -= leading
    return y


def draw_section_heading(c, text, x, y):
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x, y, text)
    return y - 14


def main():
    c = canvas.Canvas(OUTPUT_PATH, pagesize=letter)

    x = MARGIN
    y = PAGE_HEIGHT - MARGIN

    c.setFont("Helvetica-Bold", 18)
    c.drawString(x, y, "Admin Hyriki - One Page App Summary")
    y -= 18

    c.setFont("Helvetica", 9)
    c.drawString(x, y, "Source basis: repository evidence in README, app routes, API routes, query layer, and Supabase helpers")
    y -= 20

    y = draw_section_heading(c, "What it is", x, y)
    y = draw_paragraph(
        c,
        "Admin Hyriki is a Next.js admin dashboard for the Hyriki platform. It is built to manage school hiring workflows including jobs, candidates, interviews, and analytics.",
        x,
        y,
    )
    y -= 8

    y = draw_section_heading(c, "Who it is for", x, y)
    y = draw_bullet(
        c,
        "Primary persona: school administrators and recruiters managing school scoped hiring pipelines (inferred from dashboard routes, labels, and recruiter guide).",
        x,
        y,
    )
    y = draw_bullet(c, "Formal persona definition document: Not found in repo.", x, y)
    y -= 8

    y = draw_section_heading(c, "What it does", x, y)
    feature_bullets = [
        "Provides authentication flows with login, signup, reset password, and auth callback handling.",
        "Shows a dashboard with school KPI, hiring progress, and weekly activity analytics.",
        "Supports job campaign creation and management with filtering, sorting, and pagination.",
        "Supports candidate level workflows across application details, assessments, panel review, and AI recommendation pages.",
        "Provides interview views and related API endpoints for scheduling and interview stats/analytics.",
        "Includes candidate funnel analytics for drop off, browser/device issues, and candidate event timelines.",
        "Includes settings areas for account, users, school information, interview settings, and notifications.",
    ]
    for bullet in feature_bullets:
        y = draw_bullet(c, bullet, x, y)
    y -= 8

    y = draw_section_heading(c, "How it works (repo evidence)", x, y)
    architecture_bullets = [
        "UI and routing: Next.js App Router pages under src/app with protected dashboard route groups.",
        "Access control: middleware.ts and server checks use Supabase auth plus admin_user_info.school_id gating.",
        "Data fetching: server components prefetch with TanStack Query, hydrate to clients, and use SWR only for refresh/polling triggers.",
        "Services and data: API routes in src/app/api call Supabase tables and RPC functions (for example get_school_kpis and get_jobs_with_analytics).",
        "Data flow: Browser UI -> internal /api routes -> Supabase PostgreSQL/RPC -> JSON response -> hydrated client cache/UI.",
    ]
    for bullet in architecture_bullets:
        y = draw_bullet(c, bullet, x, y)
    y -= 8

    y = draw_section_heading(c, "How to run (minimal)", x, y)
    run_bullets = [
        "1. Install dependencies: npm install",
        "2. Create local env file: cp .env.example .env.local",
        "3. Set required env vars in .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY",
        "4. Start dev server: npm run dev",
        "5. Open: http://localhost:3000",
        "Node.js version requirement: Not found in repo.",
    ]
    for bullet in run_bullets:
        y = draw_bullet(c, bullet, x, y)

    c.setFont("Helvetica-Oblique", 8)
    c.drawString(
        x,
        MARGIN - 6,
        "Evidence files include README.md, package.json, middleware.ts, src/app/(dashboard)/*, src/app/api/*, src/lib/query/*, src/lib/supabase/api/*.",
    )

    c.showPage()
    c.save()


if __name__ == "__main__":
    main()
