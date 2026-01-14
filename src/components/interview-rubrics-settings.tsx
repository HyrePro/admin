'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/api/client';

interface RubricCriteria {
  id: string;
  school_id: string;
  name: string;
  description: string;
  type: 'numeric' | 'boolean' | 'descriptive';
  out_of: number;
  value: boolean;
  text: string;
  criterion_id: string; 
}

export function InterviewRubricsSettings() {
  const { schoolId } = useAuthStore();
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCriteria, setNewCriteria] = useState({
    name: '',
    description: '',
    type: 'numeric' as 'numeric' | 'boolean' | 'descriptive',
    outOf: 10
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRubrics = async () => {
      if (!schoolId) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        const { data, error } = await supabase.rpc('get_interview_rubrics', {
          p_school_id: schoolId
        });
        
        if (error) {
          toast.error('Failed to load rubrics');
          console.error('Error:', error);
          setRubricCriteria([]);
          return;
        }
        
        if (data && Array.isArray(data) && data.length > 0) {
          const transformedData = data.map((item: RubricCriteria) => ({
            id: item.id ?? `rubric-${Date.now()}-${Math.random()}`,
            school_id: item.school_id ?? schoolId,
            name: item.name ?? '',
            description: item.description ?? '',
            type: item.type ?? 'numeric',
            out_of: item.out_of ?? 0,
            value: item.value ?? false,
            text: item.text ?? '',
            criterion_id: item.criterion_id ?? ''
          }));
          setRubricCriteria(transformedData);
        } else {
          setRubricCriteria([]);
        }
      } catch (error: unknown) {
        console.error('Error fetching rubrics:', error);
        toast.error('Failed to load rubrics');
        setRubricCriteria([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRubrics();
  }, [schoolId]);

  const handleSave = async () => {
    if (!schoolId) {
      toast.error('Organization information not available');
      return;
    }

    if (rubricCriteria.length === 0) {
      toast.error('Please add at least one criteria before saving');
      return;
    }
    
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      const { error: deleteError } = await supabase
        .from('interview_rubrics')
        .delete()
        .eq('school_id', schoolId);
      
      if (deleteError) throw deleteError;
      
      const rubricsToInsert = rubricCriteria.map(criteria => ({
        school_id: criteria.school_id || schoolId,
        name: criteria.name,
        description: criteria.description,
        type: criteria.type,
        out_of: criteria.out_of
      }));
      
      const { error: insertError } = await supabase
        .from('interview_rubrics')
        .insert(rubricsToInsert);
      
      if (insertError) throw insertError;
      
      toast.success('Rubric settings saved successfully');
    } catch (error) {
      console.error('Error saving rubric settings:', error);
      toast.error('Failed to save rubric settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRubric = (id: string) => {
    setRubricCriteria(prev => prev.filter(criteria => criteria.id !== id));
    toast.success('Criteria removed');
  };

  const handleOutOfChange = (id: string, value: string) => {
    const numericValue = parseInt(value) || 1;
    setRubricCriteria(prev => 
      prev.map(criteria => 
        criteria.id === id 
          ? { ...criteria, out_of: Math.max(1, Math.min(100, numericValue)) } 
          : criteria
      )
    );
  };

  const handleAddCriteria = () => {
    if (!newCriteria.name.trim()) {
      toast.error('Please enter a criteria name');
      return;
    }

    const newRubric: RubricCriteria = {
      id: `rubric-${Date.now()}-${Math.random()}`,
      school_id: schoolId || '',
      name: newCriteria.name.trim(),
      description: newCriteria.description.trim(),
      type: newCriteria.type,
      out_of: newCriteria.type === 'boolean' ? 1 : Math.max(1, newCriteria.outOf),
      value: false,
      text: '',
      criterion_id: `rubric-${Date.now()}-${Math.random()}`
    };

    setRubricCriteria(prev => [...prev, newRubric]);
    setNewCriteria({
      name: '',
      description: '',
      type: 'numeric',
      outOf: 10
    });
    setIsDialogOpen(false);
    toast.success('Criteria added');
  };

  const maxScore = rubricCriteria
    .filter(criteria => criteria.type === 'numeric')
    .reduce((sum, criteria) => sum + criteria.out_of, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Interview Rubrics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure evaluation criteria for interview assessments
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Interview Rubrics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure evaluation criteria for interview assessments
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Criteria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Criteria</DialogTitle>
                <DialogDescription>
                  Create a new evaluation criterion for interview assessments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">
                    Criteria Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-name"
                    value={newCriteria.name}
                    onChange={(e) => setNewCriteria(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Communication Skills"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Input
                    id="new-description"
                    value={newCriteria.description}
                    onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-type">Type</Label>
                  <Select 
                    value={newCriteria.type} 
                    onValueChange={(value: 'numeric' | 'boolean' | 'descriptive') => 
                      setNewCriteria(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numeric Score</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="descriptive">Text Description</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newCriteria.type === 'numeric' && (
                  <div className="space-y-2">
                    <Label htmlFor="new-outOf">Maximum Score</Label>
                    <Input
                      id="new-outOf"
                      type="number"
                      min="1"
                      max="100"
                      value={newCriteria.outOf}
                      onChange={(e) => setNewCriteria(prev => ({ 
                        ...prev, 
                        outOf: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCriteria}>
                  Add Criteria
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {rubricCriteria.length > 0 && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {rubricCriteria.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">No Criteria Added</h3>
              <p className="text-sm text-gray-600 mb-6">
                Get started by adding your first evaluation criterion
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Criteria
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Criteria</TableHead>
                    <TableHead className="w-[20%]">Type</TableHead>
                    <TableHead className="w-[20%]">Scoring</TableHead>
                    <TableHead className="w-[20%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubricCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{criteria.name}</p>
                          {criteria.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {criteria.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {criteria.type === 'numeric' ? 'Numeric Score' : 
                           criteria.type === 'boolean' ? 'Yes/No' : 
                           'Text Description'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {criteria.type === 'numeric' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Out of</span>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              className="w-20"
                              value={criteria.out_of}
                              onChange={(e) => handleOutOfChange(criteria.id, e.target.value)}
                            />
                          </div>
                        ) : criteria.type === 'boolean' ? (
                          <span className="text-sm text-gray-600">Yes/No</span>
                        ) : (
                          <span className="text-sm text-gray-600">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveRubric(criteria.id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total Score Summary */}
              {maxScore > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Maximum Possible Score</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Based on {rubricCriteria.filter(c => c.type === 'numeric').length} numeric criteria
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{maxScore}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}