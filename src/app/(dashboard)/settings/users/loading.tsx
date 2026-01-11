import { Card, CardContent } from "@/components/ui/card";

export default function UsersSettingsLoading() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-medium">Users</h3>
        <p className="text-sm text-muted-foreground">
          Loading organization information...
        </p>
      </div>
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    </div>
  );
}