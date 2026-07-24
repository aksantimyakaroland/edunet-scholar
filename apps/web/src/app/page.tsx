import { redirect } from "next/navigation";
import { ROUTES } from "@edunet/shared";

export default function Home() {
  redirect(ROUTES.EDUCHAT);
}
