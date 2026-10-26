import { CSV_TEMPLATE } from "@/lib/onboarding";

export function GET() {
  return new Response(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="duban-catalogue-template.csv"',
    },
  });
}
