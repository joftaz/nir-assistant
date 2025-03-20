import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings as SettingsIcon } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { defaultSystemPrompt, replacePromptPlaceholders } from '@/utils/modelPrompt';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const SYSTEM_PROMPT_STORAGE_KEY = 'system_prompt';
const CATEGORIES_COUNT_KEY = 'categories_count';
const WORDS_PER_CATEGORY_KEY = 'words_per_category';

interface SettingsProps {
  onSystemPromptChange: (newPrompt: string) => void;
}

interface SettingsFormValues {
  systemPrompt: string;
  categoriesCount: number;
  wordsPerCategory: number;
}

const Settings: React.FC<SettingsProps> = ({ onSystemPromptChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      systemPrompt: '',
      categoriesCount: 4,
      wordsPerCategory: 10
    }
  });

  // Load saved settings from localStorage or use defaults
  useEffect(() => {
    const savedPrompt = localStorage.getItem(SYSTEM_PROMPT_STORAGE_KEY);
    const savedCategoriesCount = localStorage.getItem(CATEGORIES_COUNT_KEY);
    const savedWordsPerCategory = localStorage.getItem(WORDS_PER_CATEGORY_KEY);
    
    const values = {
      systemPrompt: savedPrompt || defaultSystemPrompt,
      categoriesCount: savedCategoriesCount ? parseInt(savedCategoriesCount) : 4,
      wordsPerCategory: savedWordsPerCategory ? parseInt(savedWordsPerCategory) : 10
    };
    
    form.reset(values);
  }, [form]);

  const handleSave = async (values: SettingsFormValues) => {
    // Ensure we have the latest values
    const currentValues = form.getValues();
    
    // Save all values to localStorage
    localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, currentValues.systemPrompt); // Save original prompt with placeholders
    localStorage.setItem(CATEGORIES_COUNT_KEY, currentValues.categoriesCount.toString());
    localStorage.setItem(WORDS_PER_CATEGORY_KEY, currentValues.wordsPerCategory.toString());
    
    // Log what was saved to localStorage
    console.log('Settings saved:', {
      categoriesCount: currentValues.categoriesCount,
      wordsPerCategory: currentValues.wordsPerCategory
    });
    
    // Only replace placeholders when sending to parent component
    const updatedPrompt = replacePromptPlaceholders(currentValues.systemPrompt);
    onSystemPromptChange(updatedPrompt);
    setIsOpen(false);
    
    toast({
      title: "נשמר בהצלחה",
      description: "הגדרות המערכת נשמרו",
    });
  };

  const handleResetToDefault = () => {
    const defaultValues = {
      systemPrompt: defaultSystemPrompt,
      categoriesCount: 4,
      wordsPerCategory: 10
    };
    
    form.reset(defaultValues);
    
    // Save default values to localStorage
    localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, defaultValues.systemPrompt);
    localStorage.setItem(CATEGORIES_COUNT_KEY, defaultValues.categoriesCount.toString());
    localStorage.setItem(WORDS_PER_CATEGORY_KEY, defaultValues.wordsPerCategory.toString());
    
    // Update parent component with default values
    const updatedPrompt = replacePromptPlaceholders(defaultValues.systemPrompt);
    onSystemPromptChange(updatedPrompt);
    
    toast({
      title: "איפוס בוצע",
      description: "הגדרות המערכת אופסו לברירת המחדל",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          title="הגדרות"
          aria-label="הגדרות"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הגדרות</DialogTitle>
          <DialogDescription>
            שנה את הגדרות המערכת
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="categoriesCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר קטגוריות</FormLabel>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <Slider
                          value={[field.value]}
                          min={2}
                          max={8}
                          step={1}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                        <span className="text-sm font-medium mr-4 w-8 text-center">{field.value}</span>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="wordsPerCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר מילים בכל קטגוריה</FormLabel>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <Slider
                          value={[field.value]}
                          min={2}
                          max={20}
                          step={1}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                        <span className="text-sm font-medium mr-4 w-8 text-center">{field.value}</span>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>הודעת מערכת</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={12}
                        className="font-mono text-xs rtl text-right"
                        dir="rtl"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetToDefault}
              >
                שחזר ברירת מחדל
              </Button>
              <Button type="submit">שמור</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
