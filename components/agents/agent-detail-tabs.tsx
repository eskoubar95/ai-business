"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AgentDetailTabs({
  overview,
  instructions,
  skills,
  mcp,
  settings,
}: {
  overview: ReactNode;
  instructions: ReactNode;
  skills: ReactNode;
  mcp: ReactNode;
  settings: ReactNode;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full gap-4">
      <TabsList className="flex w-full flex-wrap justify-start">
        <TabsTrigger value="overview" className="cursor-pointer">
          Overview
        </TabsTrigger>
        <TabsTrigger value="instructions" className="cursor-pointer">
          Instructions
        </TabsTrigger>
        <TabsTrigger value="skills" className="cursor-pointer">
          Skills
        </TabsTrigger>
        <TabsTrigger value="mcp" className="cursor-pointer">
          MCP
        </TabsTrigger>
        <TabsTrigger value="settings" className="cursor-pointer">
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="min-h-[200px]">
        {overview}
      </TabsContent>
      <TabsContent value="instructions" className="min-h-[200px]">
        {instructions}
      </TabsContent>
      <TabsContent value="skills" className="min-h-[200px]">
        {skills}
      </TabsContent>
      <TabsContent value="mcp" className="min-h-[200px]">
        {mcp}
      </TabsContent>
      <TabsContent value="settings" className="min-h-[200px]">
        {settings}
      </TabsContent>
    </Tabs>
  );
}
