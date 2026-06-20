import { createLazyFileRoute } from "@tanstack/react-router";
import RoomNotFoundModal from "../../components/modals/RoomNotFoundModal";

export const Route = createLazyFileRoute("/error/room-not-found")({
  component: RoomNotFoundModal,
});
