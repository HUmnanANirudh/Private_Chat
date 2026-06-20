import { createLazyFileRoute } from "@tanstack/react-router";
import GeneralErrorModal from "../../components/modals/GeneralErrorModal";

export const Route = createLazyFileRoute("/error/")({
  component: GeneralErrorModal,
});
