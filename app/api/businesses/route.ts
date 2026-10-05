import { NextRequest, NextResponse } from "next/server";
import { businessService } from "@/server/services/businessService";
import { businessSchema } from "@/lib/validation/business.schema";
import { validateAdminRequest } from "@/lib/security/auth";
import { BusinessStatus } from "@/types";

export async function GET(req: NextRequest) {
  const auth = validateAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") || undefined;
    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam as BusinessStatus) : undefined;
    const search = searchParams.get("search") || undefined;

    const businesses = await businessService.getBusinesses({
      clientId,
      status,
      search,
    });

    return NextResponse.json({ success: true, data: businesses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = validateAdminRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error || "Admin authorization required" },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const validated = businessSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.flatten(),
        },
        { status: 400 }
      );
    }

    const business = await businessService.createBusiness(validated.data, auth.user?.id);
    return NextResponse.json({ success: true, data: business }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
