import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tab {
  value: string
  label: string
  icon?: LucideIcon
}

interface MobileTabNavigationProps {
  tabs: Tab[]
  defaultValue: string
  children: React.ReactNode
}

export function MobileTabNavigation({
  tabs,
  defaultValue,
  children,
}: MobileTabNavigationProps) {
  return (
    <Tabs defaultValue={defaultValue} className="lg:hidden">
      <TabsList className="w-full flex h-auto flex-wrap gap-1 p-1 bg-muted/50">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-[120px] gap-2">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
