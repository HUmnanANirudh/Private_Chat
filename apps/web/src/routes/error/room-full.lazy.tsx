import { createLazyFileRoute } from "@tanstack/react-router";
import RoomFullModal from "../../components/RoomFullModal";

export const Route = createLazyFileRoute("/error/room-full")({
  component: RoomFullModal,
});
