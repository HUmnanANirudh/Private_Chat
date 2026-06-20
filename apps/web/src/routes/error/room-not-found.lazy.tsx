import { createLazyFileRoute } from "@tanstack/react-router";
import RoomNotFoundModal from "../../components/RoomNotFoundModal";

export const Route = createLazyFileRoute("/error/room-not-found")({
  component: RoomNotFoundModal,
});
