import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Trash2, 
  Clock, 
  MessageSquare, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getAllHistories, 
  deleteHistory, 
  deleteAllHistories, 
  isHistorySavingEnabled,
  setHistorySavingEnabled
} from '@/utils/conversationManager';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [histories, setHistories] = useState(() => {
    // Sort histories by updatedAt date in descending order (newest first)
    const allHistories = getAllHistories();
    return allHistories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });
  const [isSavingEnabled, setSavingEnabled] = useState(isHistorySavingEnabled);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);

  const handleToggleSaving = () => {
    const newValue = !isSavingEnabled;
    setSavingEnabled(newValue);
    setHistorySavingEnabled(newValue);
    
    toast({
      title: newValue ? "שמירת היסטוריה הופעלה" : "שמירת היסטוריה הושבתה",
      description: newValue 
        ? "שיחות חדשות יישמרו באופן אוטומטי" 
        : "שיחות חדשות לא יישמרו",
    });
  };

  const handleLoadHistory = (id: string) => {
    navigate(`/?history=${id}`);
  };

  const confirmDeleteHistory = (id: string) => {
    setHistoryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteHistory = () => {
    if (historyToDelete) {
      deleteHistory(historyToDelete);
      // Sort histories by updatedAt date in descending order (newest first)
      const allHistories = getAllHistories();
      setHistories(allHistories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "השיחה נמחקה",
        description: "השיחה נמחקה בהצלחה",
      });
    }
  };

  const handleDeleteAllHistories = () => {
    deleteAllHistories();
    // Set to empty array since all histories are deleted
    setHistories([]);
    setIsDeleteAllDialogOpen(false);
    
    toast({
      title: "כל ההיסטוריה נמחקה",
      description: "כל השיחות נמחקו בהצלחה",
    });
  };

  const formatDate = (date: Date) => {
    return format(date, "d בMMMM, yyyy HH:mm", { locale: he });
  };

  const getPreviewText = (history: any) => {
    if (!history.messages || history.messages.length === 0) {
      return "שיחה ריקה";
    }
    
    // Find first user message
    const firstUserMessage = history.messages.find((msg: any) => msg.isUser);
    return firstUserMessage ? firstUserMessage.text : "שיחה ריקה";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-8 sm:py-12">
      <header className="w-full max-w-3xl mx-auto mb-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לשיחה
        </Button>
        
        <motion.h1 
          className="text-2xl sm:text-3xl font-semibold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          היסטוריית שיחות
        </motion.h1>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteAllDialogOpen(true)}
          disabled={histories.length === 0}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          מחק הכל
        </Button>
      </header>
      
      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSaving}
              className="h-8 w-8"
            >
              {isSavingEnabled ? 
                <ToggleRight className="h-6 w-6 text-primary" /> : 
                <ToggleLeft className="h-6 w-6" />
              }
            </Button>
            <span className="text-sm">שמירת היסטוריה אוטומטית</span>
          </div>
          
          <span className="text-sm text-muted-foreground">
            {histories.length} שיחות שמורות
          </span>
        </div>
        
        {histories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">אין שיחות שמורות</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {histories.map((history) => (
              <motion.div
                key={history.id}
                className="border rounded-lg p-4 hover:bg-accent/10 transition-colors"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0" onClick={() => handleLoadHistory(history.id)} style={{ cursor: 'pointer' }}>
                    <h3 className="font-medium truncate" title={getPreviewText(history)}>
                      {getPreviewText(history)}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(history.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{history.messages?.length || 0} הודעות</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => confirmDeleteHistory(history.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Single History Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת שיחה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את השיחה הזו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHistory} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete All Histories Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת כל ההיסטוריה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את כל השיחות? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllHistories} className="bg-destructive text-destructive-foreground">
              מחק הכל
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;
