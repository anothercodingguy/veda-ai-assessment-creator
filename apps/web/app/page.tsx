"use client";

import { AppShell } from "../components/AppShell";
import { HomePageView } from "../components/HomePageView";

export default function HomePage() {
  return (
    <AppShell crumb="Home" active="home">
      <HomePageView />
    </AppShell>
  );
}


