import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface MFCardProps {
  title: string;
  titleClass?: string;
  description?: string;
  descriptionClass?: string;
  loading?: boolean;
  children?: React.ReactNode;
  align: "left" | "center" | "right";
  animated?: boolean;
}

export default function MFCard({
  title,
  titleClass,
  loading,
  children,
  description,
  descriptionClass,
  align = "left",
  animated = true,
}: MFCardProps) {
  if (loading)
    return (
      <Card className="w-full bg-gradient-to-br from-card to-card/50 animate-pulse">
        <div className="flex content-center justify-center py-12">
          <div className="text-muted-foreground">Loading</div>
        </div>
      </Card>
    );
  return (
    <Card 
      className={`text-${align} transition-all duration-300 hover:shadow-md border-border/20 dark:bg-gradient-to-br dark:from-card dark:to-card/80 bg-gradient-to-br from-white to-slate-50/50 ${animated ? 'hover:scale-[1.01]' : ''}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className={`${titleClass} text-lg font-semibold`}>{title}</CardTitle>
        {description && (
          <CardDescription className={`${descriptionClass} text-sm mt-1`}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
