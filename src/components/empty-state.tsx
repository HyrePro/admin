import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Users, Briefcase } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionButton?: {
    text: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  type?: 'no-data' | 'no-search-results' | 'no-filters';
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = 'No data available', 
  description = 'There is no data to display at this time.', 
  icon,
  actionButton,
  type = 'no-data'
}) => {
  // Default icon based on type
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'no-search-results':
        return <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />;
      case 'no-filters':
        return <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />;
      default:
        return <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {getIcon()}
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        {actionButton && (
          <Button 
            variant={actionButton.variant || 'default'}
            onClick={actionButton.onClick}
          >
            {actionButton.text}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;