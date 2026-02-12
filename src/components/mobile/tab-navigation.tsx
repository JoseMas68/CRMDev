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
      <TabsList className="w-full grid">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
