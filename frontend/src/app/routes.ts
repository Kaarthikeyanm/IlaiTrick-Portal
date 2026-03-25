import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Stations } from "./pages/Stations";
import { StationDetails } from "./pages/StationDetails";
import { Booking } from "./pages/Booking";
import { Payment } from "./pages/Payment";
import { MyBookings } from "./pages/MyBookings";
import { AdminDashboard } from "./pages/AdminDashboard";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { AddStation } from "./pages/AddStation";
import { ManageStation } from "./pages/ManageStation";
import { ManagePorts } from "./pages/ManagePorts";
import { BookingSuccess } from "./pages/BookingSuccess";
import { About } from "./pages/About";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "booking-success", Component: BookingSuccess },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "stations", Component: Stations },
      { path: "stations/:id", Component: StationDetails },
      { path: "booking/:id", Component: Booking },
      { path: "payment", Component: Payment },
      { path: "my-bookings", Component: MyBookings },
      { path: "admin", Component: AdminDashboard },
      { path: "owner", Component: OwnerDashboard },
      { path: "owner/add-station", Component: AddStation },
      { path: "owner/manage/:id", Component: ManageStation },
      { path: "owner/ports/:id", Component: ManagePorts },
      { path: "*", Component: NotFound },
    ],
  },
]);
