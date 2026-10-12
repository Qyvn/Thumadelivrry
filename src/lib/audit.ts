import { AuditEntityType } from "@/lib/constants";
import { prisma } from "./db";

export async function writeAudit(params: {
  actorId?: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  detail?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      detailJson: params.detail ? JSON.stringify(params.detail) : null,
    },
  });
}
