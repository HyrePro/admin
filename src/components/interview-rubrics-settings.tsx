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

  // Load rubrics from Supabase RPC
  useEffect(() => {
    const fetchRubrics = async () => {
      if (!schoolId) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // Call the RPC function to get interview rubrics
        const { data, error } = await supabase.rpc('get_interview_rubrics', {
          p_school_id: schoolId
        });
        
        if (error){
          toast.info(error.message)
          throw error;
        };
        
        // Log the actual data structure for debugging
        console.log('RPC Response:', data);
        
        // If we have data, use it
        if (data && Array.isArray(data) && data.length > 0) {
          // Transform the data to match our RubricCriteria interface
          const transformedData = data.map((item: RubricCriteria) => ({
            id: item.id ?? `rubric-${Date.now()}-${Math.random()}`,
            school_id: item.school_id ?? schoolId,
            name: item.name ?? '',
            description: item.description ?? '',
            type: item.type ?? 'numeric',
            out_of: item.out_of ?? 0,
            value: item.value ?? false,
            text: item.text ?? '',
            criterion_id: item.criterion_id??''
          }));
          setRubricCriteria(transformedData);
        } else {
          // Use empty array if no data found
          setRubricCriteria([]);
        }
      } catch (error: unknown) {
        console.error('Error fetching rubrics:', error);
        toast.error('Failed to load rubrics.');
        setRubricCriteria([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRubrics();
  }, [schoolId]);

  const handleSave = async () => {
    if (!schoolId) {
      toast.error('Organization information not available.');
      return;
    }
    
    setIsSaving(true);
    try {
      const supabase = createClient();
      
      // First, delete existing rubrics for this school
      const { error: deleteError } = await supabase
        .from('interview_rubrics')
        .delete()
        .eq('school_id', schoolId);
      
      if (deleteError) throw deleteError;
      
      // Then insert new rubrics
      if (rubricCriteria.length > 0) {
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
      }
      
      toast.success('Rubric settings saved successfully!');
    } catch (error) {
      console.error('Error saving rubric settings:', error);
      toast.error('Failed to save rubric settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRubric = (id: string) => {
    setRubricCriteria(prev => prev.filter(criteria => criteria.id !== id));
  };

  const handleRemoveAllRubrics = async () => {
    if (!confirm('Are you sure you want to remove all rubrics? This action cannot be undone.')) {
      return;
    }
    
    try {
      if (!schoolId) {
        throw new Error('School ID not available');
      }
      
      const supabase = createClient();
      const { error } = await supabase
        .from('interview_rubrics')
        .delete()
        .eq('school_id', schoolId);
      
      if (error) throw error;
      
      setRubricCriteria([]);
      toast.success('All rubrics removed successfully!');
    } catch (error) {
      console.error('Error removing rubrics:', error);
      toast.error('Failed to remove rubrics. Please try again.');
    }
  };

  const handleTypeChange = (id: string, type: 'numeric' | 'boolean' | 'descriptive') => {
    setRubricCriteria(prev => 
      prev.map(criteria => 
        criteria.id === id 
          ? { 
              ...criteria, 
              type,
              out_of: type === 'boolean' ? 1 : criteria.out_of
            } 
          : criteria
      )
    );
  };

  const handleOutOfChange = (id: string, value: string) => {
    const numericValue = parseInt(value) || 0;
    setRubricCriteria(prev => 
      prev.map(criteria => 
        criteria.id === id 
          ? { ...criteria, out_of: Math.max(1, numericValue) } 
          : criteria
      )
    );
  };

  const handleAddCriteria = () => {
    if (!newCriteria.name.trim()) {
      toast.error('Please enter a name for the new criteria');
      return;
    }

    const newRubric: RubricCriteria = {
      id: `rubric-${Date.now()}-${Math.random()}`,
      school_id: schoolId || '',
      name: newCriteria.name,
      description: newCriteria.description,
      type: newCriteria.type,
      out_of: newCriteria.type === 'boolean' ? 1 : newCriteria.outOf,
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
    setIsDialogOpen(false); // Close the dialog after adding
  };

  const maxScore = rubricCriteria
    .filter(criteria => criteria.type === 'numeric')
    .reduce((sum, criteria) => sum + criteria.out_of, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 ">
          <CardHeader className="mb-4 mt-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Interview Rubrics Settings</CardTitle>
              <CardDescription>
                Configure the evaluation criteria for interview assessments
              </CardDescription>
            </div>
          </CardHeader>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 ">
        <CardHeader className="mb-4 mt-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Interview Rubrics Settings</CardTitle>
            <CardDescription>
              Configure the evaluation criteria for interview assessments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Criteria
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Criteria</DialogTitle>
                  <DialogDescription>
                    Create a new evaluation criterion for interview assessments. 
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Criteria Name</Label>
                    <Input
                      id="new-name"
                      value={newCriteria.name}
                      onChange={(e) => setNewCriteria(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter criteria name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-type">Type</Label>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={newCriteria.type} 
                        onValueChange={(value: 'numeric' | 'boolean' | 'descriptive') => setNewCriteria(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="numeric">Numeric (Out of)</SelectItem>
                          <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                          <SelectItem value="descriptive">Descriptive</SelectItem>
                        </SelectContent>
                      </Select>
                      {newCriteria.type === 'numeric' && (
                        <>
                          <span className="text-sm">Out of</span>
                          <Input
                            id="new-outOf"
                            type="number"
                            min="1"
                            className="w-20"
                            value={newCriteria.outOf}
                            onChange={(e) => setNewCriteria(prev => ({ ...prev, outOf: parseInt(e.target.value) || 1 }))}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-description">Description (Optional)</Label>
                    <Input
                      id="new-description"
                      value={newCriteria.description}
                      onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description"
                      className="min-h-[60px] text-start"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCriteria}>
                    Add Criteria
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </div>
      <div className="flex-grow overflow-y-auto">
        <CardContent>
          <div className="space-y-6 mx-auto">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criteria Name & Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubricCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="font-medium">{criteria.name}</div>
                        <div className="text-sm text-muted-foreground mt-1 whitespace-normal">
                          {criteria.description || "No description provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="capitalize">{criteria.type}</div>
                      </TableCell>
                      <TableCell>
                        {criteria.type === 'numeric' ? (
                          <div className="flex items-center gap-2">
                            <span>Out of</span>
                            <Input
                              id={`outOf-${criteria.id}`}
                              type="number"
                              min="1"
                              className="w-20"
                              value={criteria.out_of}
                              onChange={(e) => handleOutOfChange(criteria.id, e.target.value)}
                            />
                          </div>
                        ) : criteria.type === 'boolean' ? (
                          <span>Yes/No</span>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveRubric(criteria.id)}
                        >
                          <Trash2 className="w-4 h-4 hover:text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Total Score at the Bottom */}
            <div className="bg-muted p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Maximum Possible Score</p>
                  <p className="text-2xl font-bold">{maxScore}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Rubric Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}