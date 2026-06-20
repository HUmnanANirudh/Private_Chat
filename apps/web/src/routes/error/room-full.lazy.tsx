import { createLazyFileRoute } from "@tanstack/react-router";
import RoomFullModal from "../../components/modals/RoomFullModal";

export const Route = createLazyFileRoute("/error/room-full")({
  component: RoomFullModal,
});
