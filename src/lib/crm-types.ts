export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export type LeadRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: LeadStatus;
  customerId: string | null;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  shopifyOrderId: string;
  customerId: string;
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  totalPrice: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  createdAt: string;
};

export type ProductRecord = {
  id: string;
  title: string | null;
  sku: string | null;
  price: string | null;
  inventoryLevels: Array<{
    available: number;
    onHand: number;
    committed: number;
    lowStockThreshold: number | null;
  }>;
};

export type NoteRecord = { id: string; body: string; createdAt: string };

export function leadName(
  lead: Pick<LeadRecord, "firstName" | "lastName">,
): string {
  return (
    [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unnamed lead"
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMoney(value: number | string | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
}
