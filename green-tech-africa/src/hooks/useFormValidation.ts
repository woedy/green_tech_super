import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';
import { useToast } from '@/components/ui/use-toast';

interface UseFormValidationProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  onSubmit,
  successMessage,
  errorMessage,
  ...formProps
}: UseFormValidationProps<T>) {
  const { toast } = useToast();
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...formProps,
  });

  const handleSubmit = form.handleSubmit(async (data: T) => {
    try {
      await onSubmit(data);
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      
      // Reset form on success if no custom behavior is needed
      if (!formProps.defaultValues) {
        form.reset();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : (errorMessage || "An error occurred. Please try again.");
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  });

  // Helper to get field error message
  const getFieldError = (fieldName: Path<T>) => {
    return form.formState.errors[fieldName]?.message;
  };

  // Helper to check if field has error
  const hasFieldError = (fieldName: Path<T>) => {
    return !!form.formState.errors[fieldName];
  };

  // Helper to get field state
  const getFieldState = (fieldName: Path<T>) => {
    const error = form.formState.errors[fieldName];
    const isDirty = form.formState.dirtyFields[fieldName];
    const isTouched = form.formState.touchedFields[fieldName];
    
    return {
      error: error?.message,
      hasError: !!error,
      isDirty: !!isDirty,
      isTouched: !!isTouched,
      isValid: !error && (isDirty || isTouched),
    };
  };

  return {
    form,
    handleSubmit,
    getFieldError,
    hasFieldError,
    getFieldState,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
  };
}