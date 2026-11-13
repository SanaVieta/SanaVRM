import { Users, ShoppingCart, Box, LucideIcon } from "lucide-react";

type Route = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const routes: Route[] = [
  { href: "/", label: "Leads", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Box },
];
