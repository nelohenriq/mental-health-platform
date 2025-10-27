'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

interface WorksheetField {
  id: string;
  type: 'text' | 'textarea' | 'slider' | 'checkbox' | 'radio' | 'number';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

interface CBTWorksheetProps {
  exerciseId: string;
  content: any;
  onComplete: (data: any) => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export function CBTWorksheet({
  exerciseId,
  content,
  onComplete,
  onSave,
  initialData = {}
}: CBTWorksheetProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const fields: WorksheetField[] = content.fields || [];
  const steps = content.steps || [fields];
  const totalSteps = steps.length;

  const currentFields = steps[currentStep] || [];

  useEffect(() => {
    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        onSave(formData);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, onSave]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const renderField = (field: WorksheetField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'slider':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}: {value || field.min || 0}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Slider
              value={[value || field.min || 0]}
              onValueChange={(vals) => handleFieldChange(field.id, vals[0])}
              min={field.min || 0}
              max={field.max || 10}
              step={field.step || 1}
              className="w-full"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={value || false}
                onCheckedChange={(checked: boolean) => handleFieldChange(field.id, checked)}
              />
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
            </div>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(val: string) => handleFieldChange(field.id, val)}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step}
              required={field.required}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Exercise Completed! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Great job completing this CBT exercise. Your progress has been saved.
          </p>
          <div className="mt-4 text-center">
            <Button onClick={() => window.location.reload()}>
              Start Another Exercise
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{content.title || 'CBT Exercise'}</CardTitle>
        {totalSteps > 1 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={((currentStep + 1) / totalSteps) * 100} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {content.instructions && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-sm text-muted-foreground">{content.instructions}</p>
          </div>
        )}

        <div className="space-y-4">
          {currentFields.map((field: WorksheetField) => renderField(field))}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <Button variant="outline" onClick={handleSave}>
            Save Progress
          </Button>

          <Button onClick={handleNext}>
            {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}