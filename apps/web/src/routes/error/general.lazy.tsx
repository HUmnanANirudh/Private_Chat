import { createLazyFileRoute } from "@tanstack/react-router";
import GeneralErrorModal from "../../components/GeneralErrorModal";

export const Route = createLazyFileRoute("/error/general")({
  component: GeneralErrorModal,
});
