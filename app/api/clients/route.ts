import { NextRequest, NextResponse } from "next/server";
import { clientService } from "@/server/services/clientService";
import { clientSchema } from "@/lib/validation/client.schema";
import { validateAdminRequest } from "@/lib/security/auth";
import { ClientStatus } from "@/types";

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
    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam as ClientStatus) : undefined;
    const search = searchParams.get("search") || undefined;

    const clients = await clientService.getClients({ search, status });
    return NextResponse.json({ success: true, data: clients });
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
    const validated = clientSchema.safeParse(body);
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

    const client = await clientService.createClient(validated.data, auth.user?.id);
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
