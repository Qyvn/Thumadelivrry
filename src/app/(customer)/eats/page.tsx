import { redirect } from "next/navigation";

export default function EatsRedirectPage() {
  redirect("/browse/food");
}
