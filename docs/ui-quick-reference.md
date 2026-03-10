# UI/UX Quick Reference Guide

**For Developers**: Quick guide to using the new design system

---

## Spacing System (4px base)

```tsx
// Good
className="p-4 gap-3 space-y-4"

// Bad
className="p-[17px] gap-[11px]"
```

**Scale**: `xs:4px, sm:8px, md:16px, lg:24px, xl:32px, 2xl:48px`

---

## Card Components

### Standard Card
```tsx
<div className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
  {/* Content with consistent spacing */}
  <div className="gap-3 flex flex-col">
    {/* Card content here */}
  </div>
</div>
```

### Draggable Card
```tsx
<div className="bg-card border rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
  {/* Content */}
</div>
```

---

## Button Sizes

### Icon Buttons (Improved)
```tsx
// Use h-8 w-8 for better touch targets (32px)
<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
  <Icon className="h-4 w-4" />
</Button>
```

### Regular Buttons
```tsx
// Default size is h-10 (40px)
<Button className="h-10">Click me</Button>
```

---

## Action Menus in Cards

### Proper Pattern
```tsx
<div className="relative">
  {/* Card content with right padding for menu */}
  <div className="pr-10">
    {/* Title and content */}
  </div>

  {/* Absolute positioned menu button */}
  <div className="absolute top-3 right-3">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      {/* Content */}
    </DropdownMenu>
  </div>
</div>
```

---

## Drag Handle Pattern

```tsx
{/* When useDragHandle is true */}
<div
  className="absolute top-3 right-3 p-1.5 hover:bg-muted rounded-md cursor-grab active:cursor-grabbing touch-none transition-colors z-10"
  title="Arrastrar para reordenar"
>
  <GripVertical className="h-4 w-4 text-muted-foreground" />
</div>
```

---

## Typography

### Headings
```tsx
<h1 className="text-2xl font-bold">Title</h1>
<h2 className="text-xl font-semibold">Subtitle</h2>
<h3 className="text-lg font-semibold">Section</h3>
```

### Body Text
```tsx
<p className="text-sm text-muted-foreground">Description</p>
<span className="text-xs font-medium">Label</span>
```

### Truncation
```tsx
<h4 className="font-medium text-sm line-clamp-2">Long title that might wrap</h4>
<p className="text-xs truncate">Single line text</p>
```

---

## Badges

### Status Badges
```tsx
<Badge className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
  Status
</Badge>
```

### Priority Badges
```tsx
<Badge variant="secondary" className="text-xs font-normal px-2 py-1">
  High Priority
</Badge>
```

---

## Avatars

### Standard Avatar
```tsx
<Avatar className="h-8 w-8">
  <AvatarImage src={user.image} />
  <AvatarFallback className="text-xs font-medium">
    {getInitials(user.name)}
  </AvatarFallback>
</Avatar>
```

### Avatar with Ring
```tsx
<Avatar className="h-12 w-12 ring-2 ring-background">
  {/* Content */}
</Avatar>
```

---

## Icons with Text

### Consistent Pattern
```tsx
<span className="text-sm text-muted-foreground flex items-center gap-1.5">
  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
  <span>Label text</span>
</span>
```

---

## Footer in Cards

### Standard Pattern
```tsx
<div className="flex items-center justify-between pt-3 border-t mt-auto">
  <div className="flex items-center gap-3">
    {/* Left side items */}
  </div>

  <div className="flex items-center gap-2">
    {/* Right side items */}
  </div>
</div>
```

---

## Empty States

### Improved Pattern
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
    <Icon className="h-6 w-6 text-muted-foreground/50" />
  </div>
  <p className="text-sm text-muted-foreground">
    Empty state message
  </p>
</div>
```

---

## Responsive Patterns

### Hide on Mobile
```tsx
<span className="hidden sm:inline-block">
  Desktop only text
</span>
```

### Truncate on Mobile
```tsx
<span className="truncate max-w-[80px] sm:max-w-[120px]">
  Responsive text
</span>
```

---

## Hover Effects

### Card Hover
```tsx
className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
```

### Button Hover
```tsx
className="hover:bg-muted transition-colors"
```

### Scale Effect
```tsx
// With Framer Motion
<motion.div
  whileHover={{ scale: 1.015 }}
  whileTap={{ scale: 0.98 }}
>
  {/* Content */}
</motion.div>
```

---

## Accessibility

### Icon-Only Buttons
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  aria-label="More options"
>
  <Icon className="h-4 w-4" />
</Button>
```

### Touch Targets
```tsx
// Minimum 44px for mobile
<button className="min-h-[44px] min-w-[44px]">
  Clickable area
</button>
```

---

## Colors (Semantic)

### Status Colors
```typescript
import { statusColors } from "@/lib/design-system";

// Use in component
<Badge className={statusColors.client.CUSTOMER}>
  {statusLabels.client.CUSTOMER}
</Badge>
```

---

## Common Patterns

### Link with Icon
```tsx
<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
>
  <Icon className="h-3.5 w-3.5" />
  <span>Label</span>
  <ExternalLink className="h-2.5 w-2.5" />
</a>
```

### Metadata Section
```tsx
<div className="flex flex-wrap items-center gap-2">
  <Badge variant="secondary">Tag 1</Badge>
  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
    <Icon className="h-3.5 w-3.5" />
    Metadata
  </span>
</div>
```

---

## Import Design System

```typescript
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  componentSizes,
  statusColors
} from "@/lib/design-system";
```

---

## Quick Checklist

Before committing UI changes:

- [ ] Spacing uses 4px scale (no arbitrary values)
- [ ] Touch targets are minimum 44px on mobile
- [ ] Icon buttons have aria-label
- [ ] Hover states provide clear feedback
- [ ] Cards have consistent padding (p-4)
- [ ] Gap between elements is consistent (gap-3)
- [ ] Text truncates properly (line-clamp)
- [ ] Responsive design tested
- [ ] Animations use GPU acceleration
- [ ] Focus states are visible

---

## Testing

### Visual Regression
```bash
# Run Storybook (if available)
npm run storybook

# Or manually test each component
```

### Responsive Testing
Test at: 375px (mobile), 768px (tablet), 1024px (desktop)

### Accessibility Testing
```bash
# Run lighthouse
npm run lighthouse

# Or use axe DevTools extension
```

---

**Pro Tip**: When in doubt, copy an existing component that looks good! 🎨
