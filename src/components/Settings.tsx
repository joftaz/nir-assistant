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
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { 
  defaultSystemPrompt, 
  defaultSentencePrompt,
  defaultStagedWordsPrompt,
  defaultSynonymsPrompt,
  replacePromptPlaceholders, 
  SYSTEM_PROMPT_STORAGE_KEY,
  SENTENCE_PROMPT_STORAGE_KEY,
  STAGED_WORDS_PROMPT_STORAGE_KEY,
  SYNONYMS_PROMPT_STORAGE_KEY,
  CATEGORIES_COUNT_KEY,
  WORDS_PER_CATEGORY_KEY,
  WORDS_COUNT_KEY,
  GENDER_STORAGE_KEY,
  SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY,
  default2ndPersonSentencePrompt,
  SENTENCE_CHILDREN_PROMPT_STORAGE_KEY,
  defaultChildrenSentencePrompt
} from '@/utils/modelPrompt';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsProps {
  onSystemPromptChange: (newPrompt: string) => void;
}

interface SettingsFormValues {
  systemPrompt: string;
  sentencePrompt: string;
  sentence2ndPersonPrompt: string;
  sentenceChildrenPrompt: string;
  stagedWordsPrompt: string;
  synonymsPrompt: string;
  categoriesCount: number;
  wordsPerCategory: number;
  wordsCount: number;
  gender: string;
}

const Settings: React.FC<SettingsProps> = ({ onSystemPromptChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedPrompt, setSelectedPrompt] = useState('system');
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      systemPrompt: '',
      sentencePrompt: '',
      sentence2ndPersonPrompt: '',
      sentenceChildrenPrompt: '',
      stagedWordsPrompt: '',
      synonymsPrompt: '',
      categoriesCount: 4,
      wordsPerCategory: 10,
      wordsCount: 10,
      gender: 'זכר'
    }
  });

  // Load saved settings from localStorage or use defaults
  useEffect(() => {
    const savedPrompt = localStorage.getItem(SYSTEM_PROMPT_STORAGE_KEY);
    const savedSentencePrompt = localStorage.getItem(SENTENCE_PROMPT_STORAGE_KEY);
    const savedSentence2ndPersonPrompt = localStorage.getItem(SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY);
    const savedSentenceChildrenPrompt = localStorage.getItem(SENTENCE_CHILDREN_PROMPT_STORAGE_KEY);
    const savedStagedWordsPrompt = localStorage.getItem(STAGED_WORDS_PROMPT_STORAGE_KEY);
    const savedSynonymsPrompt = localStorage.getItem(SYNONYMS_PROMPT_STORAGE_KEY);
    const savedCategoriesCount = localStorage.getItem(CATEGORIES_COUNT_KEY);
    const savedWordsPerCategory = localStorage.getItem(WORDS_PER_CATEGORY_KEY);
    const savedWordsCount = localStorage.getItem(WORDS_COUNT_KEY);
    const savedGender = localStorage.getItem(GENDER_STORAGE_KEY);
    
    const values = {
      systemPrompt: savedPrompt || defaultSystemPrompt,
      sentencePrompt: savedSentencePrompt || defaultSentencePrompt,
      sentence2ndPersonPrompt: savedSentence2ndPersonPrompt || default2ndPersonSentencePrompt,
      sentenceChildrenPrompt: savedSentenceChildrenPrompt || defaultChildrenSentencePrompt,
      stagedWordsPrompt: savedStagedWordsPrompt || defaultStagedWordsPrompt,
      synonymsPrompt: savedSynonymsPrompt || defaultSynonymsPrompt,
      categoriesCount: savedCategoriesCount ? parseInt(savedCategoriesCount) : 4,
      wordsPerCategory: savedWordsPerCategory ? parseInt(savedWordsPerCategory) : 10,
      wordsCount: savedWordsCount ? parseInt(savedWordsCount) : 10,
      gender: savedGender || 'זכר'
    };
    
    form.reset(values);
  }, [form]);

  const handleSave = async (values: SettingsFormValues) => {
    // Ensure we have the latest values
    const currentValues = form.getValues();
    
    // Save all values to localStorage
    localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, currentValues.systemPrompt);
    localStorage.setItem(SENTENCE_PROMPT_STORAGE_KEY, currentValues.sentencePrompt);
    localStorage.setItem(SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY, currentValues.sentence2ndPersonPrompt);
    localStorage.setItem(SENTENCE_CHILDREN_PROMPT_STORAGE_KEY, currentValues.sentenceChildrenPrompt);
    localStorage.setItem(STAGED_WORDS_PROMPT_STORAGE_KEY, currentValues.stagedWordsPrompt);
    localStorage.setItem(SYNONYMS_PROMPT_STORAGE_KEY, currentValues.synonymsPrompt);
    localStorage.setItem(CATEGORIES_COUNT_KEY, currentValues.categoriesCount.toString());
    localStorage.setItem(WORDS_PER_CATEGORY_KEY, currentValues.wordsPerCategory.toString());
    localStorage.setItem(WORDS_COUNT_KEY, currentValues.wordsCount.toString());
    localStorage.setItem(GENDER_STORAGE_KEY, currentValues.gender);
    
    // Log what was saved to localStorage
    console.log('Settings saved:', {
      categoriesCount: currentValues.categoriesCount,
      wordsPerCategory: currentValues.wordsPerCategory,
      wordsCount: currentValues.wordsCount,
      gender: currentValues.gender
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
      sentencePrompt: defaultSentencePrompt,
      sentence2ndPersonPrompt: default2ndPersonSentencePrompt,
      sentenceChildrenPrompt: defaultChildrenSentencePrompt,
      stagedWordsPrompt: defaultStagedWordsPrompt,
      synonymsPrompt: defaultSynonymsPrompt,
      categoriesCount: 4,
      wordsPerCategory: 10,
      wordsCount: 10,
      gender: 'זכר'
    };
    
    form.reset(defaultValues);
    
    // Save default values to localStorage
    localStorage.setItem(SYSTEM_PROMPT_STORAGE_KEY, defaultValues.systemPrompt);
    localStorage.setItem(SENTENCE_PROMPT_STORAGE_KEY, defaultValues.sentencePrompt);
    localStorage.setItem(SENTENCE_2ND_PERSON_PROMPT_STORAGE_KEY, defaultValues.sentence2ndPersonPrompt);
    localStorage.setItem(SENTENCE_CHILDREN_PROMPT_STORAGE_KEY, defaultValues.sentenceChildrenPrompt);
    localStorage.setItem(STAGED_WORDS_PROMPT_STORAGE_KEY, defaultValues.stagedWordsPrompt);
    localStorage.setItem(SYNONYMS_PROMPT_STORAGE_KEY, defaultValues.synonymsPrompt);
    localStorage.setItem(CATEGORIES_COUNT_KEY, defaultValues.categoriesCount.toString());
    localStorage.setItem(WORDS_PER_CATEGORY_KEY, defaultValues.wordsPerCategory.toString());
    localStorage.setItem(WORDS_COUNT_KEY, defaultValues.wordsCount.toString());
    localStorage.setItem(GENDER_STORAGE_KEY, defaultValues.gender);
    
    // Update parent component with default values
    const updatedPrompt = replacePromptPlaceholders(defaultValues.systemPrompt);
    onSystemPromptChange(updatedPrompt);
    
    toast({
      title: "איפוס בוצע",
      description: "הגדרות המערכת אופסו לברירת המחדל",
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          data-track-click="Settings clicked"
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
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
                <TabsTrigger value="prompts">פרומפטים</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
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
                  name="wordsCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מספר מילים נרדפות</FormLabel>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <Slider
                            value={[field.value]}
                            min={4}
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
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>מגדר</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4 rtl flex-row-reverse"
                          dir="rtl"
                        >
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="זכר" id="male" />
                            <Label htmlFor="male">זכר</Label>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="נקבה" id="female" />
                            <Label htmlFor="female">נקבה</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="prompts" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label>בחר פרומפט:</Label>
                    <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="בחר פרומפט" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">פרומפט מערכת</SelectItem>
                        <SelectItem value="sentence">פרומפט משפטי הצהרה</SelectItem>
                        <SelectItem value="sentence2nd">פרומפט משפטים בשיחה</SelectItem>
                        <SelectItem value="sentenceChildren">פרומפט משפטים לילדים</SelectItem>
                        <SelectItem value="staged">פרומפט מילים זמניות</SelectItem>
                        <SelectItem value="synonyms">פרומפט מילים נרדפות</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4">
                    {selectedPrompt === 'system' && (
                      <FormField
                        control={form.control}
                        name="systemPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פרומפט מערכת (עבור קטגוריות מילים)</FormLabel>
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
                    )}

                    {selectedPrompt === 'sentence' && (
                      <FormField
                        control={form.control}
                        name="sentencePrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פרומפט יצירת משפטים</FormLabel>
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
                    )}

                    {selectedPrompt === 'sentence2nd' && (
                      <FormField
                        control={form.control}
                        name="sentence2ndPersonPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פרומפט יצירת משפטים בגוף שני</FormLabel>
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
                    )}

                    {selectedPrompt === 'sentenceChildren' && (
                      <FormField
                        control={form.control}
                        name="sentenceChildrenPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פרומפט יצירת משפטים לילדים</FormLabel>
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
                    )}

                    {selectedPrompt === 'staged' && (
                      <FormField
                        control={form.control}
                        name="stagedWordsPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פרומפט מילים זמניות</FormLabel>
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
                    )}

                    {selectedPrompt === 'synonyms' && (
                      <FormField
                        control={form.control}
                        name="synonymsPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>פרומפט מילים נרדפות</FormLabel>
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
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetToDefault}
              >
                אפס להגדרות ברירת מחדל
              </Button>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    ביטול
                  </Button>
                </DialogClose>
                <Button type="submit">
                  שמור
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
