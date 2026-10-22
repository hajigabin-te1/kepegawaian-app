# Design Decisions — Aplikasi Kepegawaian

## Design principle
The interface must look like a polished institutional employee-management application:
professional, calm, trustworthy, efficient, and visually distinctive.

It must NOT look like a generic AI-generated SaaS dashboard.

## Color system: 60-30-10

Use the following fixed brand palette. Do not introduce additional brand colors.

### 60% — Base / neutral surface
- Hex: `#F8F8FF`
- Usage: page background, form background, light cards, light sections.
- This is the dominant background color of the application.

### 30% — Primary brand / structural color
- Hex: `#191970`
- Usage:
  - Sidebar background.
  - Header or top bar when appropriate.
  - Primary buttons.
  - Active navigation.
  - Important headings.
  - Table header.
  - Login brand panel.
- Text on this color must be `#F8F8FF` or white.

### 10% — Accent
- Hex: `#87CEFA`
- Usage:
  - Active sidebar indicator.
  - Hover state accents.
  - Focus ring.
  - Selected state.
  - Small highlights.
  - Subtle borders or decorative geometric elements.
  - Badges or tags only when paired with dark navy text.
- Do not use `#87CEFA` as body text on `#F8F8FF`; its contrast is too low.
- Do not use `#87CEFA` as the main button color.

### Supporting semantic colors
Use these only for status and feedback:

- Success: muted green.
- Warning: amber.
- Danger: restrained red.
- Muted text: desaturated navy-gray.
- Border: subtle navy-gray.

## Contrast rules
- Navy `#191970` text on `#F8F8FF` background: allowed.
- `#F8F8FF` or white text on navy `#191970`: allowed.
- Navy `#191970` text on accent `#87CEFA`: allowed.
- Accent `#87CEFA` text on `#F8F8FF`: forbidden.
- Accent `#87CEFA` may be used for icons, indicators, borders, and decorative details, but not for primary reading text on light backgrounds.

## Typography
- UI font: Inter.
- Use tabular numbers for employee IDs, dates, counts, and tables.
- Page title: `text-2xl font-semibold tracking-tight`.
- Section title: `text-lg font-semibold`.
- Card title: `text-base font-semibold`.
- Body: `text-sm`.
- Table text: `text-sm`.
- Small label: `text-xs font-medium uppercase tracking-wide`.
- Do not use decorative display fonts in dashboard pages.

## Layout language

### General
- Use a structured admin layout with a permanent sidebar on desktop.
- Use generous but controlled whitespace.
- Prefer clear borders, solid surfaces, and strong navy structural elements.
- Avoid flat, empty, overly minimal layouts with no visual hierarchy.
- Avoid generic centered white cards with no brand presence.

### Sidebar
The sidebar is a core part of the visual identity.

Requirements:
- Background: navy `#191970`.
- Text and icons: `#F8F8FF` or white.
- Active menu item:
  - Background: subtle lighter navy or translucent white.
  - Left indicator or accent bar: `#87CEFA`.
  - Text: `#F8F8FF`.
- Hover state: subtle lighter navy background.
- Include:
  - Application/institution logo or monogram.
  - Application name.
  - Navigation items with Lucide icons.
  - User profile section at the bottom.
  - Logout action.
- Sidebar must collapse into a Sheet or drawer on mobile.

### Header
- Background: `#F8F8FF` or white.
- Border-bottom: subtle navy-gray.
- Contains:
  - Page title or breadcrumb.
  - Search input where relevant.
  - Notification icon.
  - User avatar/menu.
- Keep the header visually light so the navy sidebar remains the dominant structural element.

### Buttons
- Primary button:
  - Background: `#191970`.
  - Text: `#F8F8FF` or white.
  - Hover: slightly lighter navy.
- Secondary button:
  - Background: transparent or `#F8F8FF`.
  - Border: navy or subtle navy-gray.
  - Text: `#191970`.
- Accent button:
  - Use sparingly.
  - Background: `#87CEFA`.
  - Text: `#191970`.
  - Only for selected/highlight actions, not the main CTA.
- Destructive button:
  - Restrained red.
  - Used only for delete or irreversible actions.

### Cards
- Background: white or `#F8F8FF`.
- Border: subtle navy-gray.
- Radius: `rounded-lg`.
- Avoid heavy shadows.
- Use a small accent detail only when it improves hierarchy, such as a left accent bar or icon container.

### Tables
- Header: navy `#191970` background with `#F8F8FF` text, or a light navy-tinted header with dark navy text.
- Rows: white or `#F8F8FF`.
- Row hover: very subtle `#87CEFA` tint.
- Use compact but readable rows.
- Use badges for employee status.
- Use tabular numbers for numeric columns.

## Login page direction
The login page must feel premium, institutional, and intentional—not like a basic centered form.

Preferred layout:
- Desktop: split-screen layout.
  - Left side: login form on `#F8F8FF`.
  - Right side: navy `#191970` brand panel.
- Mobile:
  - Navy brand header at the top.
  - Login form below it.

Login form requirements:
- Institution or application logo/monogram.
- Clear title, for example: “Masuk ke Aplikasi Kepegawaian”.
- Short supporting text.
- Username field.
- Password field with show/hide toggle.
- Primary login button using navy `#191970`.
- Clear validation and error states.
- Subtle accent details using `#87CEFA`.

Navy brand panel requirements:
- Background: `#191970`.
- Use `#87CEFA` for subtle geometric accents, thin lines, grid pattern, or abstract institutional shapes.
- Include application name and a short Indonesian tagline.
- Do not use stock illustrations, 3D characters, mesh gradients, or glassmorphism.
- The panel must not look empty; use composition, typography, and restrained geometry.

## Dashboard direction
The dashboard must feel like a real employee-management workspace.

Requirements:
- Navy sidebar on the left.
- Light `#F8F8FF` content area.
- Clear page title and breadcrumb.
- KPI cards with useful employee-related metrics.
- A primary data table or activity section.
- Consistent spacing and strong typographic hierarchy.
- Use realistic Indonesian labels and mock data clearly marked as temporary.

Do not add:
- Fake charts.
- Decorative empty cards.
- Generic “Welcome back” filler sections without purpose.
- Purple-blue gradients.
- Glassmorphism.
- 3D illustrations.

## Component rules
- Use shadcn/ui components.
- Use Lucide icons only.
- Use consistent icon sizes.
- Use `rounded-lg` as the default radius.
- Use semantic color tokens, not raw Tailwind colors.
- Every page must have one clear primary action.
- Every data-driven page must handle loading, empty, error, and destructive confirmation states.

## Anti-generic rules
Do not produce:
- A plain centered login card with no brand presence.
- A dashboard with a white sidebar and no visual identity.
- Purple-blue gradients.
- Glassmorphism.
- Mesh gradients.
- 3D blobs or generic illustrations.
- Neon colors.
- Excessive shadows.
- Fake analytics or decorative charts.
- Repeated identical cards with no informational value.